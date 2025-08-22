import { validators } from "@eik/common";
import originalUrl from "original-url";
import HttpError from "http-errors";
import abslog from "abslog";
import Metrics from "@metrics/client";

import { createFilePathToImportMap } from "../utils/path-builders-fs.js";
import HttpOutgoing from "../classes/http-outgoing.js";
import config from "../utils/defaults.js";
import { decodeUriComponent } from "../utils/utils.js";

/**
 * @typedef {object} MapGetOptions
 * @property {boolean} [etag]
 * @property {string} [cacheControl]
 * @property {Array<[string, string]>} [organizations] List of key-value pairs [hostname, organization]
 * @property {import("@eik/sink").default} [sink]
 * @property {import("abslog").AbstractLoggerOptions} [logger]
 */

const MapGet = class MapGet {
	/**
	 * @param {MapGetOptions} options
	 */
	constructor({ organizations, cacheControl, logger, sink, etag } = {}) {
		this._organizations = organizations || config.organizations;
		this._cacheControl = cacheControl || "public, max-age=31536000, immutable";
		this._sink = sink;
		this._etag = etag || config.etag;
		this._log = abslog(logger);
		this._metrics = new Metrics();
		this._histogram = this._metrics.histogram({
			name: "eik_core_map_get_handler",
			description:
				"Histogram measuring time taken in @eik/core MapGet handler method",
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

	async handler(req, name, version) {
		const end = this._histogram.timer();

		const pVersion = decodeUriComponent(version);
		const pName = decodeUriComponent(name);

		try {
			validators.version(pVersion);
			validators.name(pName);
		} catch (error) {
			this._log.debug(`map:get - Validation failed - ${error.message}`);
			const e = new HttpError.NotFound();
			end({ labels: { success: false, status: e.status } });
			throw e;
		}

		const url = originalUrl(req);
		const org = this._orgRegistry.get(url.hostname);

		if (!org) {
			this._log.info(
				`map:get - Hostname does not match a configured organization - ${url.hostname}`,
			);
			const e = new HttpError.BadRequest();
			end({ labels: { success: false, status: e.status, type: "map" } });
			throw e;
		}

		const path = createFilePathToImportMap({
			org,
			name: pName,
			version: pVersion,
		});

		try {
			const file = await this._sink.read(path);
			const outgoing = new HttpOutgoing();
			outgoing.cacheControl = this._cacheControl;
			outgoing.mimeType = "application/json";

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
					this._log.info(`map:get - File stream error - ${err}`);
					end({ labels: { success: false, status: 503, type: "map" } });
				});

				outgoing.stream.on("end", () => {
					end({ labels: { status: outgoing.statusCode, type: "map" } });
				});
			}

			this._log.debug(`map:get - Import map found - Pathname: ${path}`);

			return outgoing;
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			this._log.debug(`map:get - Import map not found - Pathname: ${path}`);
			const e = new HttpError.NotFound();
			end({ labels: { success: false, status: e.status, type: "map" } });
			throw e;
		}
	}
};
export default MapGet;
