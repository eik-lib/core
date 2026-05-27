import { Writable, Readable, pipeline } from "node:stream";

/**
 * @param {any} sink
 * @param {string} path
 */
const readJSON = (sink, path) =>
	// eslint-disable-next-line no-async-promise-executor
	new Promise(async (resolve, reject) => {
		try {
			/** @type {any[]} */
			const buffer = [];
			const from = await sink.read(path);

			const to = new Writable({
				objectMode: false,
				write(chunk, encoding, callback) {
					buffer.push(chunk);
					callback();
				},
			});

			pipeline(from.stream, to, (error) => {
				if (error) return reject(error);
				const str = buffer.join("").toString();
				try {
					const obj = JSON.parse(str);
					return resolve(obj);
				} catch (err) {
					return reject(err);
				}
			});
		} catch (error) {
			reject(error);
		}
	});
/**
 * @param {any} sink
 * @param {string} path
 */
const readEikJson = (sink, path) => sink.exist(path);

/**
 * @param {any} sink
 * @param {string} path
 * @param {any} obj
 * @param {string} contentType
 */
const writeJSON = (sink, path, obj, contentType) =>
	// eslint-disable-next-line no-async-promise-executor
	new Promise(async (resolve, reject) => {
		try {
			const buffer = Buffer.from(JSON.stringify(obj));

			const from = new Readable({
				objectMode: false,
				read() {
					this.push(buffer);
					this.push(null);
				},
			});

			const to = await sink.write(path, contentType);

			pipeline(from, to, (error) => {
				if (error) return reject(error);
				return resolve(buffer);
			});
		} catch (error) {
			reject(error);
		}
	});
/**
 * @param {any} from
 */
const streamCollector = (from) =>
	new Promise((resolve, reject) => {
		/** @type {any[]} */
		const buffer = [];
		const to = new Writable({
			write(chunk, encoding, cb) {
				buffer.push(chunk);
				cb();
			},
		});

		pipeline(from, to, (error) => {
			if (error) return reject(error);
			return resolve(buffer.join("").toString());
		});
	});

/**
 * @param {any} stat
 */
const etagFromFsStat = (stat) => {
	const mtime = stat.mtime.getTime().toString(16);
	const size = stat.size.toString(16);
	return `W/"${size}-${mtime}"`;
};

/**
 * @param {any} value
 */
const decodeUriComponent = (value) => {
	if (value === null || value === undefined) return value;
	return decodeURIComponent(value);
};

export {
	readJSON,
	writeJSON,
	streamCollector,
	etagFromFsStat,
	decodeUriComponent,
	readEikJson,
};
