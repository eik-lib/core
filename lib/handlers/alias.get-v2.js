import { validators } from "@eik/common";
import originalUrl from "original-url";
import HttpError from "http-errors";
import abslog from "abslog";
import Metrics from "@metrics/client";
import Asset from "../classes/asset.js";

import { decodeUriComponent, readJSON } from "../utils/utils.js";
import {
	createFilePathToAlias,
	createFilePathToAsset,
} from "../utils/path-builders-fs.js";
import HttpOutgoing from "../classes/http-outgoing.js";
import config from "../utils/defaults.js";

/**
 * @typedef {object} AliasGetOptions
 * @property {boolean} [etag]
 * @property {string} [cacheControl]
 * @property {Array<[string, string]>} [organizations] List of key-value pairs [hostname, organization]
 * @property {import("@eik/sink").default} [sink]
 * @property {import("abslog").AbstractLoggerOptions} [logger]
 */

const AliasGet = class AliasGet {
	/**
	 * @param {AliasGetOptions} options
	 */
	constructor({ organizations, cacheControl, logger, sink, etag } = {}) {
		this._organizations = organizations || config.organizations;
		// 2 weeks stale while revalidate
		this._cacheControl = cacheControl || "public, max-age=1200, stale-while-revalidate=1209600";
		this._sink = sink;
		this._etag = etag || config.etag;
		this._log = abslog(logger);
		this._metrics = new Metrics();
		this._histogram = this._metrics.histogram({
			name: "eik_core_alias_get_handler",
			description:
				"Histogram measuring time taken in @eik/core AliasGet handler method",
			labels: {
				success: true,
				type: "unknown",
			},
			buckets: [0.005, 0.01, 0.06, 0.1, 0.6, 1.0, 2.0, 4.0],
		});
		this._orgRegistry = new Map(this._organizations);
	}

	get metrics() {
		return this._metrics;
	}

	async handler(req, type, name, alias, extra) {
		const end = this._histogram.timer();

		const pAlias = decodeUriComponent(alias);
		const pExtra = decodeUriComponent(extra);
		const pName = decodeUriComponent(name);

		try {
			validators.alias(pAlias);
			validators.extra(pExtra);
			validators.name(pName);
			validators.type(type);
		} catch (error) {
			this._log.debug(`alias:get - Validation failed - ${error.message}`);
			const e = new HttpError.NotFound();
			end({ labels: { success: false, status: e.status } });
			throw e;
		}

		const url = originalUrl(req);
		const org = this._orgRegistry.get(url.hostname);

		if (!org) {
			this._log.info(
				`alias:get - Hostname does not match a configured organization - ${url.hostname}`,
			);
			const e = new HttpError.BadRequest();
			end({ labels: { success: false, status: e.status, type } });
			throw e;
		}

		const path = createFilePathToAlias({
			org,
			type,
			name: pName,
			alias: pAlias,
		});

		try {
			const obj = await readJSON(this._sink, path);

			const asset = new Asset({
				pathname: pExtra,
				version: obj.version,
				name: obj.name,
				type: obj.type,
				org: obj.org,
			});

			const assetPath = createFilePathToAsset(asset);

			const file = await this._sink.read(assetPath);
			const outgoing = new HttpOutgoing();
			outgoing.cacheControl = this._cacheControl;
			outgoing.mimeType = asset.mimeType;

			if (this._etag) {
				outgoing.etag = file.etag;
			}

			if (this._etag && req.headers["if-none-match"] === file.etag) {
				outgoing.statusCode = 304;
				file.stream.destroy();
			} else {
				outgoing.statusCode = 200;
				outgoing.stream = file.stream;

				outgoing.stream.on("error", (err) => {
					this._log.info(`alias:get - File stream error - ${err}`);
					end({ labels: { success: false, status: 503, type } });
				});

				outgoing.stream.on("end", () => {
					end({ labels: { status: outgoing.statusCode, type } });
				});
			}

			this._log.debug(`alias:get - Alias found - Pathname: ${path}`);

			end({ labels: { status: outgoing.statusCode, type } });

			return outgoing;
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			this._log.debug(`alias:get - Alias not found - Pathname: ${path}`);
			const e = new HttpError.NotFound();
			end({ labels: { success: false, status: e.status, type } });
			throw e;
		}
	}
};
export default AliasGet;
