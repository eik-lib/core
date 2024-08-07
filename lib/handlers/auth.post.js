import originalUrl from "original-url";
import HttpError from "http-errors";
import Metrics from "@metrics/client";
import abslog from "abslog";

import MultipartParser from "../multipart/parser.js";
import HttpIncoming from "../classes/http-incoming.js";
import HttpOutgoing from "../classes/http-outgoing.js";
import Author from "../classes/author.js";
import config from "../utils/defaults.js";

/**
 * @typedef {object} AuthPostOptions
 * @property {string} [authKey]
 * @property {string} [cacheControl]
 * @property {Array<[string, string]>} [organizations] List of key-value pairs [hostname, organization]
 * @property {import("abslog").AbstractLoggerOptions} [logger]
 */

const AuthPost = class AuthPost {
	/**
	 * @param {AuthPostOptions} options
	 */
	constructor({ organizations, cacheControl, authKey, logger } = {}) {
		this._organizations = organizations || config.organizations;
		this._cacheControl = cacheControl;
		this._authKey = authKey || config.authKey;
		this._log = abslog(logger);
		this._metrics = new Metrics();
		this._histogram = this._metrics.histogram({
			name: "eik_core_auth_post_handler",
			description:
				"Histogram measuring time taken in @eik/core AuthPost handler method",
			labels: {
				success: true,
				type: "unknown",
			},
			buckets: [0.005, 0.01, 0.06, 0.1, 0.6, 1.0, 2.0, 4.0],
		});
		this._orgRegistry = new Map(this._organizations);

		this._multipart = new MultipartParser({
			legalFields: ["key"],
		});
	}

	get metrics() {
		return this._metrics;
	}

	_parser(incoming) {
		return new Promise((resolve, reject) => {
			this._multipart
				.parse(incoming)
				.then((result) => {
					const obj = result[0];
					if (obj && obj.constructor.name === "FormField") {
						if (obj.value !== this._authKey) {
							this._log.info(
								`auth:post - Auth submitted an illegal key: ${obj.value}`,
							);
							throw new HttpError.Unauthorized();
						}
						const author = new Author({
							user: "generic_user",
							name: "Generic User",
						});
						resolve(author);
						return;
					}
					throw new HttpError.BadRequest();
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	async handler(req) {
		const end = this._histogram.timer();

		const url = originalUrl(req);
		const org = this._orgRegistry.get(url.hostname);

		if (!org) {
			this._log.info(
				`auth:post - Hostname does not match a configured organization - ${url.hostname}`,
			);
			const e = new HttpError.BadRequest();
			end({ labels: { success: false, status: e.status, type: "auth" } });
			throw e;
		}

		const incoming = new HttpIncoming(req, {
			org,
		});

		const obj = await this._parser(incoming);

		const outgoing = new HttpOutgoing();
		outgoing.cacheControl = this._cacheControl;
		outgoing.statusCode = 200;
		outgoing.mimeType = "application/json";
		outgoing.body = obj;

		end({ labels: { status: outgoing.statusCode, type: "auth" } });

		return outgoing;
	}
};
export default AuthPost;
