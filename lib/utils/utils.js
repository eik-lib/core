import { Writable, pipeline } from "node:stream";

/**
 * @param {any} sink
 * @param {string} path
 */
const readJSON = async (sink, path) => {
	const buffer = await sink.readBuffer(path);
	return JSON.parse(buffer.toString("utf8"));
};

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
const writeJSON = async (sink, path, obj, contentType) => {
	const buffer = Buffer.from(JSON.stringify(obj));
	await sink.writeBuffer(path, contentType, buffer);
	return buffer;
};

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
			return resolve(Buffer.concat(buffer).toString("utf8"));
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
