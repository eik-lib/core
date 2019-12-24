'use strict';

const { Writable, Readable } = require('stream');
const { ReadFile } = require('@eik/common');
const { join } = require('path');
const mime = require('mime/lite');

const Entry = require('./mem-entry');

const DEFAULT_ROOT_PATH = '/eik';

/**
 * A sink for persisting files to memory
 *
 * @class SinkMem
 */

const SinkMem = class SinkMem {
    constructor({ rootPath = DEFAULT_ROOT_PATH } = {}) {
        this._rootPath = rootPath;
        this._state = new Map();
    }

    write(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            const mimeType = mime.getType(pathname) || 'application/octet-stream';

            const payload = [];
            const stream = new Writable({
                write(chunk, encoding, cb) {
                    payload.push(chunk);
                    cb();
                },
            });

            stream.on('finish', () => {
                const entry = new Entry({ mimeType, payload });
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
            const file = new ReadFile( {
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
        });
    }

    delete(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = join(this._rootPath, filePath);

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

    get [Symbol.toStringTag]() {
        return 'SinkMEM';
    }
}
module.exports = SinkMem;
