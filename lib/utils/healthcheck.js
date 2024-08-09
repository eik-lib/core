import { Writable, pipeline } from "node:stream";
import { URL } from "node:url";
import abslog from "abslog";
import slug from "unique-slug";
import fs from "node:fs";

const fileReader = (file = "../../README.md") =>
	fs.createReadStream(new URL(file, import.meta.url));

/**
 * @typedef {object} HealthCheckOptions
 * @property {import("@eik/sink").default} [sink]
 * @property {import("abslog").AbstractLoggerOptions} [logger]
 */

const HealthCheck = class HealthCheck {
	/**
	 * @param {HealthCheckOptions} options
	 */
	constructor({ sink, logger } = {}) {
		this._sink = sink;
		this._name = `./system/tmp/health_${slug()}.txt`;
		this._log = abslog(logger);
	}

	_write() {
		return new Promise((resolve, reject) => {
			this._sink
				.write(this._name, "text/plain")
				.then((destination) => {
					const source = fileReader();
					pipeline(source, destination, (error) => {
						if (error) return reject(error);
						return resolve();
					});
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	_read() {
		return new Promise((resolve, reject) => {
			this._sink
				.read(this._name)
				.then((source) => {
					const buffer = [];
					const destination = new Writable({
						objectMode: false,
						write(chunk, encoding, callback) {
							buffer.push(chunk);
							callback();
						},
					});

					pipeline(source.stream, destination, (error) => {
						if (error) return reject(error);
						return resolve();
					});
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	_delete() {
		return this._sink.delete(this._name);
	}

	_exist() {
		return this._sink.exist(this._name);
	}

	async check() {
		this._log.debug(
			`Sink health check started - testing with file ${this._name}`,
		);

		try {
			await this._write();
		} catch (error) {
			this._log.warn("Sink health check errored during write");
			this._log.error(error);
			throw error;
		}

		try {
			await this._exist();
		} catch (error) {
			this._log.warn(
				"Sink health check errored when checking content written by sink.write(). Content was probably not written to sink.",
			);
			this._log.error(error);
			throw error;
		}

		try {
			await this._read();
		} catch (error) {
			this._log.warn("Sink health check errored during read");
			this._log.error(error);
			throw error;
		}

		try {
			await this._delete();
		} catch (error) {
			this._log.warn("Sink health check errored during deletion");
			this._log.error(error);
			throw error;
		}

		try {
			await this._exist();
			this._log.warn(
				"Sink health check successfully read file after deletion. It should not. Content was probably not deleted by sink.delete().",
			);
			throw new Error("File exist in sink");
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			this._log.debug("Sink health check ended successfully. Sink is healthy");
		}

		return true;
	}

	get [Symbol.toStringTag]() {
		return "HealthCheck";
	}
};

export default HealthCheck;
