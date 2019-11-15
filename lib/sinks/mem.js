'use strict';

const { Writable, Readable } = require('stream');
const { join } = require('path');

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

            const buff = [];
            const stream = new Writable({
                write(chunk, encoding, cb) {
                    buff.push(chunk);
                    cb();
                },
            });

            stream.on('finish', () => {
                this._state.set(pathname, buff);
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

            const buff = this._state.get(pathname) || [];
            const stream = new Readable({
                read() {
                    buff.forEach(item => {
                        this.push(item);
                    });
                    this.push(null);
                },
            });

            resolve(stream);

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
