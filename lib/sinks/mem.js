'use strict';

const { Writable, Readable } = require('stream');
const { join } = require('path');

const ReadFile = require('../classes/read-file');
const Entry = require('./mem-entry');

/**
 * A sink for persisting files to memory
 *
 * @class SinkMem
 */

const SinkMem = class SinkMem {
    constructor() {
        this._rootPath = '/eik';
        this._state = new Map();
    }

    write(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            const buff = [];
            const stream = new Writable({
                write(chunk, encoding, cb) {
                    buff.push(chunk);
                    cb();
                },
            });

            stream.on('finish', () => {
                const entry = new Entry(buff);
                this._state.set(pathname, entry);
            });

            resolve(stream);
        });
    }

    read(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            const entry = this._state.get(pathname);
            const payload = entry.payload || [];
            const file = new ReadFile( { etag: entry.hash });

            file.stream = new Readable({
                read() {
                    payload.forEach(item => {
                        this.push(item);
                    });
                    this.push(null);
                },
            });;

            resolve(file);

            // TODO: Handle if stream never opens or errors, set a timeout which will reject with an error
        });
    }

    delete(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            this._state.delete(pathname);
            resolve();
        });
    }

    exist(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            if (this._state.has(pathname)) {
                resolve();
                return;
            }
            reject(new Error('File does not exist'));
        });
    }
}
module.exports = SinkMem;
