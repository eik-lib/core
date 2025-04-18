import { pipeline } from "node:stream";
import HttpError from "http-errors";
import Busboy from "busboy";
import abslog from "abslog";
import ssri from "ssri";
import { Parser } from "tar";

import { createFilePathToAsset } from "../utils/path-builders-fs.js";
import FormField from "./form-field.js";
import FormFile from "./form-file.js";
import Asset from "../classes/asset.js";

/**
 * @typedef {object} MultipartParserOptions
 * @property {number} [pkgMaxFileSize=10000000]
 * @property {string[]} [legalFields]
 * @property {string[]} [legalFiles]
 * @property {import("@eik/sink").default} [sink]
 * @property {import("abslog").AbstractLoggerOptions} [logger]
 */

const MultipartParser = class MultipartParser {
	/**
	 * @param {MultipartParserOptions} options
	 */
	constructor({ pkgMaxFileSize, legalFields, legalFiles, logger, sink } = {}) {
		this._pkgMaxFileSize = pkgMaxFileSize;
		this._legalFields = legalFields || [];
		this._legalFiles = legalFiles || [];
		this._sink = sink;
		this._log = abslog(logger);
	}

	get [Symbol.toStringTag]() {
		return "MultipartParser";
	}

	parse(incoming) {
		return new Promise((resolve, reject) => {
			const queue = [];

			const busboy = Busboy({
				headers: incoming.headers,
				limits: {
					fileSize: this._pkgMaxFileSize,
					fields: this._legalFields.length,
					files: this._legalFiles.length,
				},
			});

			busboy.on("field", (name, value) => {
				if (!this._legalFields.includes(name.toLowerCase())) {
					busboy.emit("error", new HttpError.BadRequest());
					return;
				}

				queue.push(
					this._handleField({
						value,
						name,
					}),
				);
			});

			busboy.on("file", (fieldname, file, filename) => {
				if (!this._legalFiles.includes(fieldname.toLowerCase())) {
					busboy.emit("error", new HttpError.BadRequest());
					return;
				}

				queue.push(
					new Promise((done) => {
						this._handleFile({
							fieldname,
							file,
							filename,
							incoming,
						})
							.then((item) => {
								done(item);
							})
							.catch((error) => {
								// Emit an error on busboy instead of rejecting
								// This will break and terminate the stream stright away
								busboy.emit("error", error);
							});
					}),
				);
			});

			busboy.once("error", (error) => {
				reject(error);
			});

			busboy.once("close", () => {
				Promise.all(queue)
					.then((items) => {
						resolve(items);
					})
					.catch((error) => {
						reject(error);
					});
			});

			// If incoming.request is handeled by pipeline, it will close
			// to early for the http framework to handle it. Let the
			// http framework handle closing incoming.request
			incoming.request.pipe(busboy);
		});
	}

	_handleField({ name, value }) {
		this._log.info(
			`multipart - Input field added - Name: ${name} - Value: ${value}`,
		);
		return new FormField({ name, value });
	}

	_handleFile({ fieldname, file, filename, incoming }) {
		return new Promise((resolve, reject) => {
			this._log.info(
				`multipart - Start extracting package - Field: ${fieldname} - Filename: ${filename}`,
			);

			const queue = [];

			file.once("limit", () => {
				this._log.info(
					`multipart - Uploaded package exceeds legal file size limit - Field: ${fieldname} - Filename: ${filename}`,
				);
				file.emit("error", new HttpError.PayloadTooLarge());
			});

			const extract = new Parser({
				strict: true,
				onReadEntry: (entry) => {
					// Entries not supported must be thrown
					// away for extraction to continue
					if (entry.type.toLowerCase() !== "file") {
						entry.resume();
						return;
					}
					queue.push(this._persistFile({ incoming, entry }));
				},
			});

			pipeline(file, extract, (error) => {
				if (error) {
					this._log.info(
						`multipart - Uploaded package could not be extracted properly - Field: ${fieldname} - Filename: ${filename}`,
					);
					this._log.trace(error);

					switch (error.code) {
						case "TAR_BAD_ARCHIVE":
						case "TAR_ABORT":
							reject(new HttpError.UnsupportedMediaType());
							break;
						case "TAR_ENTRY_UNSUPPORTED":
						case "TAR_ENTRY_INVALID":
						case "TAR_ENTRY_ERROR":
							reject(new HttpError.UnprocessableEntity());
							break;
						default:
							reject(error);
					}
					return;
				}

				Promise.all(queue)
					.then((result) => {
						const formFile = new FormFile({ name: fieldname, value: result });
						resolve(formFile);
					})
					.catch((err) => {
						reject(err);
					});
			});
		});
	}

	_persistFile({ incoming, entry }) {
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			const asset = new Asset({
				pathname: entry.path,
				version: incoming.version,
				name: incoming.name,
				type: incoming.type,
				org: incoming.org,
			});
			asset.size = entry.size;

			const path = createFilePathToAsset(asset);

			this._log.info(
				`multipart - Start writing asset to sink - Pathname: ${path}`,
			);

			try {
				const writer = await this._sink.write(path, asset.mimeType);

				const integrityStream = ssri.integrityStream({ single: true });
				let hash = "";
				integrityStream.once("integrity", (integrity) => {
					hash = integrity;
				});

				pipeline(entry, integrityStream, writer, (error) => {
					if (error) {
						this._log.error(
							`multipart - Failed writing asset to sink - Pathname: ${path}`,
						);
						this._log.trace(error);

						reject(error);
						return;
					}

					asset.integrity = hash.toString();

					this._log.info(
						`multipart - Successfully wrote asset to sink - Pathname: ${path}`,
					);

					resolve(asset);
				});
			} catch (error) {
				reject(error);
			}
		});
	}
};
export default MultipartParser;
