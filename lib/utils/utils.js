'use strict';

const { Writable, Readable, pipeline } = require('stream');

const readJSON = (sink, path) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        try {
            const buffer = [];
            const from = await sink.read(path);

            const to = new Writable({
                objectMode: false,
                write(chunk, encoding, callback) {
                    buffer.push(chunk);
                    callback();
                },
            });

            pipeline(from.stream, to, error => {
                if (error) return reject(error);
                const str = buffer.join('').toString();
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
};
module.exports.readJSON = readJSON;

const writeJSON = (sink, path, obj, contentType) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
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

            pipeline(from, to, error => {
                if (error) return reject(error);
                return resolve(buffer);
            });
        } catch (error) {
            reject(error);
        }
    });
};
module.exports.writeJSON = writeJSON;

const streamCollector = (from) => {
    return new Promise((resolve, reject) => {
        const buffer = [];
        const to = new Writable({
            write(chunk, encoding, cb) {
                buffer.push(chunk);
                cb();
            },
        });

        pipeline(from, to, error => {
            if (error) return reject(error);
            return resolve(buffer.join('').toString());
        });
    });
};
module.exports.streamCollector = streamCollector;

const etagFromFsStat = (stat) => {
    const mtime = stat.mtime.getTime().toString(16)
    const size = stat.size.toString(16)
    return `W/"${size}-${mtime}"`;
};
module.exports.etagFromFsStat = etagFromFsStat;
