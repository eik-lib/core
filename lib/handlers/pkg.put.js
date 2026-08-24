import { validators } from "@eik/common";
import originalUrl from "original-url";
import HttpError from "http-errors";
import Metrics from "@metrics/client";
import abslog from "abslog";
import ssri from "ssri";

import {
	createFilePathToPackage,
	createFilePathToVersion,
	createFilePathToEikJson,
} from "../utils/path-builders-fs.js";
import {
	decodeUriComponent,
	writeJSON,
	readJSON,
	readEikJson,
} from "../utils/utils.js";
import { createURIPathToPkgLog } from "../utils/path-builders-uri.js";
import MultipartParser from "../multipart/parser.js";
import HttpIncoming from "../classes/http-incoming.js";
import HttpOutgoing from "../classes/http-outgoing.js";
import Versions from "../classes/versions.js";
import Package from "../classes/package.js";
import Author from "../classes/author.js";
import Asset from "../classes/asset.js";
import config from "../utils/defaults.js";

/**
 * @typedef {object} PkgPutOptions
 * @property {number} [pkgMaxFileSize=10000000]
 * @property {string} [cacheControl]
 * @property {Array<[string, string]>} [organizations] List of key-value pairs [hostname, organization]
 * @property {import("@eik/sink").default} [sink]
 * @property {import("abslog").AbstractLoggerOptions} [logger]
 */

const PkgPut = class PkgPut {
	/**
	 * @param {PkgPutOptions} options
	 */
	constructor({
		pkgMaxFileSize,
		organizations,
		cacheControl,
		logger,
		sink,
	} = {}) {
		this._pkgMaxFileSize = pkgMaxFileSize || config.pkgMaxFileSize;
		this._organizations = organizations || config.organizations;
		this._cacheControl = cacheControl;
		this._sink = sink;
		this._log = abslog(logger);
		this._metrics = new Metrics();
		this._histogram = this._metrics.histogram({
			name: "eik_core_pkg_put_handler",
			description:
				"Histogram measuring time taken in @eik/core PkgPut handler method",
			labels: {
				success: true,
				type: "unknown",
			},
			buckets: [0.005, 0.01, 0.06, 0.1, 0.6, 1.0, 2.0, 4.0],
		});
		this._orgRegistry = new Map(this._organizations);

		this._multipart = new MultipartParser({
			pkgMaxFileSize: this._pkgMaxFileSize,
			legalFiles: ["package"],
			sink: this._sink,
		});
	}

	get metrics() {
		return this._metrics;
	}

	/**
	 * @param {any} incoming
	 */
	async _parser(incoming) {
		return new Promise((resolve, reject) => {
			this._multipart
				.parse(incoming)
				.then((result) => {
					const pkg = new Package(incoming);
					/** @type {Record<string,any>|null} */
					let eikJson = null;
					result.forEach((/** @type {any} */ obj) => {
						if (obj.constructor.name === "FormField") {
							pkg.setMeta(obj);
						}
						if (obj.constructor.name === "FormFile") {
							eikJson = obj.eikJson;
							obj.value.forEach((/** @type {any} */ o) => {
								pkg.setAsset(o);
							});
						}
					});
					return { pkg, eikJson };
				})
				.then(({ pkg, eikJson }) => {
					resolve({ pkg, eikJson });
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	/**
	 * Writes eik.json to the sink as the final committed marker for a version.
	 * Merges any fields from the client's eik.json (captured from the tar) with
	 * server-authoritative values, ensuring the file is always server-written
	 * regardless of what the client's tar contained.
	 *
	 * Returns an Asset representing the written file so the caller can include
	 * it in the package's asset list.
	 *
	 * @param {any} incoming
	 * @param {Record<string,any>|null} capturedEikJson
	 * @returns {Promise<InstanceType<typeof Asset>>}
	 */
	async _writeEikJson(incoming, capturedEikJson) {
		const content = {
			...capturedEikJson,
			name: incoming.name,
			version: incoming.version,
			type: incoming.type,
		};
		const eikJsonPath = createFilePathToEikJson(incoming);
		const buffer = await writeJSON(
			this._sink,
			eikJsonPath,
			content,
			"application/json",
		);
		this._log.info(
			`pkg:put - Successfully wrote eik.json to sink - Pathname: ${eikJsonPath} - TraceId: ${incoming.request?.traceId}`,
		);

		const asset = new Asset({
			pathname: "eik.json",
			version: incoming.version,
			name: incoming.name,
			type: incoming.type,
			org: incoming.org,
		});
		asset.integrity = ssri
			.fromData(buffer, { algorithms: ["sha512"] })
			.toString();
		asset.size = buffer.length;
		return asset;
	}

	/**
	 * @param {any} incoming
	 * @returns {Promise<InstanceType<typeof Versions>>}
	 */
	async _readVersions(incoming) {
		const path = createFilePathToVersion(incoming);

		if (!this._sink) throw new Error("No sink configured");

		try {
			await this._sink.exist(path);
		} catch {
			// File does not exist — this is a new package.
			this._log.info(
				`pkg:put - Version meta file did not exist in sink - Create new - Pathname: ${path} - TraceId: ${incoming.request?.traceId}`,
			);
			return new Versions(incoming);
		}

		// File exists. Any failure here (GCS error, corrupt JSON, network
		// timeout) must propagate rather than be swallowed — silently falling
		// back to an empty Versions object would cause _writeVersions to
		// overwrite the index and erase the entire version history.
		const obj = await readJSON(this._sink, path);
		this._log.info(
			`pkg:put - Successfully read version meta file from sink - Pathname: ${path} - TraceId: ${incoming.request?.traceId}`,
		);
		return new Versions(obj);
	}

	/**
	 * @param {any} incoming
	 */
	async _readVersion(incoming) {
		const path = createFilePathToEikJson(incoming);
		try {
			await readEikJson(this._sink, path);
			this._log.info(
				`pkg:put - Found version meta file from sink - Pathname: ${path} - TraceId: ${incoming.request?.traceId}`,
			);
			return true;
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			// File does not exist, its probably a new package
			this._log.info(
				`pkg:put - Did not find meta file in sink - Create new - Pathname: ${path} - TraceId: ${incoming.request?.traceId}`,
			);
			return false;
		}
	}

	/**
	 * @param {any} incoming
	 * @param {any} versions
	 */
	async _writeVersions(incoming, versions) {
		const path = createFilePathToVersion(incoming);
		await writeJSON(this._sink, path, versions, "application/json");
		this._log.info(
			`pkg:put - Successfully wrote version meta file to sink - Pathname: ${path} - TraceId: ${incoming.request?.traceId}`,
		);
	}

	/**
	 * @param {any} req
	 * @param {any} user
	 * @param {string} type
	 * @param {string} name
	 * @param {string} version
	 */
	async handler(req, user, type, name, version) {
		const end = this._histogram.timer();
		const traceId = req.traceId;

		const pVersion = decodeUriComponent(version);
		const pName = decodeUriComponent(name);

		try {
			validators.version(pVersion);
			validators.name(pName);
			validators.type(type);
		} catch (error) {
			this._log.info(
				`pkg:put - Validation failed - ${error instanceof Error ? error.message : String(error)} - TraceId: ${traceId}`,
			);
			const e = new HttpError.BadRequest();
			end({ labels: { success: false, status: e.status } });
			throw e;
		}

		const url = originalUrl(req);
		const org = this._orgRegistry.get(url.hostname);

		if (!org) {
			this._log.debug(
				`pkg:put - Hostname does not match a configured organization - ${url.hostname} - TraceId: ${traceId}`,
			);
			const e = new HttpError.BadRequest();
			end({ labels: { success: false, status: e.status, type } });
			throw e;
		}

		const author = new Author(user);

		const incoming = new HttpIncoming(req, {
			version: pVersion,
			author,
			type,
			name: pName,
			org,
		});

		this._log.info(
			`pkg:put - Received upload - Name: ${pName} - Version: ${pVersion} - TraceId: ${traceId}`,
		);

		const versionExists = await this._readVersion(incoming);

		if (versionExists) {
			this._log.info(
				`pkg:put - Semver version already exists for the package - Org: ${org} - Name: ${pName} - Version: ${pVersion} - TraceId: ${traceId}`,
			);
			const e = new HttpError.Conflict();
			end({ labels: { success: false, status: e.status, type } });
			throw e;
		}

		const versions = await this._readVersions(incoming).catch(() => {
			this._log.error(
				`pkg:put - Failed to read version meta from sink - Name: ${pName} - Version: ${pVersion} - TraceId: ${traceId}`,
			);
			const e = new HttpError.BadGateway();
			end({ labels: { success: false, status: e.status, type } });
			throw e;
		});

		const { pkg, eikJson } = await this._parser(incoming);

		// Write eik.json before package metadata so the asset list is complete
		// when {version}.package.json is written to the sink.
		let eikJsonAsset;
		try {
			eikJsonAsset = await this._writeEikJson(incoming, eikJson);
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			this._log.error(
				`pkg:put - Failed to write eik.json to sink - Name: ${pName} - Version: ${pVersion} - TraceId: ${traceId}`,
			);
			const e = new HttpError.BadGateway();
			end({ labels: { success: false, status: e.status, type } });
			throw e;
		}
		pkg.setAsset(eikJsonAsset);

		try {
			const pkgMetaPath = createFilePathToPackage(pkg);
			await writeJSON(this._sink, pkgMetaPath, pkg, "application/json");
			this._log.info(
				`pkg:put - Successfully wrote package meta file to sink - Pathname: ${pkgMetaPath} - TraceId: ${traceId}`,
			);
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			this._log.error(
				`pkg:put - Failed to write package meta to sink - Name: ${pName} - Version: ${pVersion} - TraceId: ${traceId}`,
			);
			const e = new HttpError.BadGateway();
			end({ labels: { success: false, status: e.status, type } });
			throw e;
		}

		versions.setVersion(pVersion, pkg.integrity);

		try {
			await this._writeVersions(incoming, versions);
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			this._log.error(
				`pkg:put - Failed to write version meta to sink - Name: ${pName} - Version: ${pVersion} - TraceId: ${traceId}`,
			);
			const e = new HttpError.BadGateway();
			end({ labels: { success: false, status: e.status, type } });
			throw e;
		}

		const outgoing = new HttpOutgoing();
		outgoing.cacheControl = this._cacheControl || "";
		outgoing.statusCode = 303;
		outgoing.location = createURIPathToPkgLog(pkg);

		this._log.info(
			`pkg:put - Upload completed - Name: ${pName} - Version: ${pVersion} - TraceId: ${traceId}`,
		);

		end({ labels: { status: outgoing.statusCode, type } });

		return outgoing;
	}
};
export default PkgPut;
