'use strict';

const { Writable, Readable, pipeline } = require('stream');

const readJSON = (sink, path) => {
    return new Promise((resolve, reject) => {
        const buffer = [];

        const from = sink.read(path);

        const to = new Writable({
            objectMode: false,
            write(chunk, encoding, callback) {
                buffer.push(chunk);
                callback();
            },
        });

        pipeline(from, to, error => {
            if (error) return reject(error);
            const str = buffer.join().toString();
            try {
                const obj = JSON.parse(str);
                resolve(obj);
            } catch (err) {
                reject(err);
            }
        });
    });
};
module.exports.readJSON = readJSON;

const writeJSON = (sink, path, obj, contentType) => {
    return new Promise((resolve, reject) => {
        const buffer = Buffer.from(JSON.stringify(obj));

        const from = new Readable({
            objectMode: false,
            read() {
                this.push(buffer);
                this.push(null);
            },
        });

        const to = sink.write(path, contentType);

        pipeline(from, to, error => {
            if (error) return reject(error);
            resolve(buffer);
        });
    });
};
module.exports.writeJSON = writeJSON;
