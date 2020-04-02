'use strict';

const { Writable, Readable } = require('stream');
const { ReadFile, Sink } = require('@eik/common');
const mime = require('mime/lite');
const path = require('path');

const Entry = require('./mem-entry');

const DEFAULT_ROOT_PATH = '/eik';

const SinkTest = class SinkTest extends Sink {
    constructor({ rootPath = DEFAULT_ROOT_PATH } = {}) {
        super();
        this._rootPath = rootPath;
        this._state = new Map();

        this._writeDelayResolve = () => -1;
        this._writeDelayChunks = () => -1;
    }

    set(filePath, payload) {
        const pathname = path.join(this._rootPath, filePath);
        const mimeType = mime.getType(pathname) || 'application/octet-stream';

        let entry;

        if (Array.isArray(payload)) {
            entry = new Entry({ mimeType, payload, });
        } else {
            entry = new Entry({ mimeType, payload: [payload], });
        }

        this._state.set(pathname, entry);
    }

    get(filePath) {
        const pathname = path.join(this._rootPath, filePath);
        if (this._state.has(pathname)) {
            const entry = this._state.get(pathname);
            return entry.payload.join('');
        }
        return null;
    }

    dump() {
        return Array.from(this._state.entries());
    }

    load(items) {
        if (!Array.isArray(items)) {
            throw new Error('Argument "items" must be an Array');
        }
        this._state = new Map(items);
    }

    set writeDelayResolve(fn) {
        if (typeof fn !== "function") {
            throw new TypeError('Value must be a function');
        }
        this._writeDelayResolve = fn;
    }

    set writeDelayChunks(fn) {
        if (typeof fn !== "function") {
            throw new TypeError('Value must be a function');
        }
        this._writeDelayChunks = fn;
    }

    // Common SINK API

    write(filePath, contentType) {
        const file = super.constructor.validateFilePath(filePath);
        const mime = super.constructor.validateContentType(contentType);

        return new Promise((resolve, reject) => {
            const pathname = path.join(this._rootPath, file);

            if (pathname.indexOf(this._rootPath) !== 0) {
                reject(new Error(`Directory traversal - ${file}`));
                return;
            }

            const chunkDelay = this._writeDelayChunks;
            const payload = [];
            let count = 0;
            const stream = new Writable({
                write(chunk, encoding, cb) {
                    const timeout = chunkDelay(count);
                    count += 1;

                    if (timeout < 0) {
                        payload.push(chunk);
                        cb();
                    } else {
                        setTimeout(() => {
                            payload.push(chunk);
                            cb();
                        }, timeout);
                    }
                },
            });

            stream.on('finish', () => {
                const entry = new Entry({ mimeType: mime, payload, });
                this._state.set(pathname, entry);
            });

            const resolveDelay = this._writeDelayResolve();
            if (resolveDelay < 0) {
                resolve(stream);
            } else {
                setTimeout(() => {
                    resolve(stream);
                }, resolveDelay);
            }
        });
    }

    read(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            const entry = this._state.get(pathname);
            const payload = entry.payload || [];
            const file = new ReadFile({
                mimeType: entry.mimeType,
                etag: entry.hash,
            });

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
            const pathname = path.join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            // Delete recursively
            Array.from(this._state.keys()).forEach((key) => {
                if (key.startsWith(pathname)) {
                    this._state.delete(key);
                }
            });

            resolve();
        });
    }

    exist(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._rootPath, filePath);

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


    get [Symbol.toStringTag]() {
        return 'SinkTest';
    }
}
module.exports = SinkTest;
