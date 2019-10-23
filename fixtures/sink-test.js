'use strict';

const { Writable, Readable } = require('stream');
const path = require('path');

const DEFAULT_ROOT_PATH = '/asset-pipe';


class SinkTest {
    constructor({
        rootPath = DEFAULT_ROOT_PATH
    } = {}) {
        this._rootPath = rootPath;
        this._state = new Map();
    }

    set(filePath, contents) {
        const pathname = path.join(this._rootPath, filePath);
        if (Array.isArray(contents)) {
            this._state.set(pathname, contents);
        } else {
            this._state.set(pathname, [contents]);
        }
    }

    get(filePath) {
        const pathname = path.join(this._rootPath, filePath);
        if (this._state.has(pathname)) {
            const entry = this._state.get(pathname);
            return entry.join('');
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

    write(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                return reject(new Error(`Directory traversal - ${filePath}`));
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
            const pathname = path.join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                return reject(new Error(`Directory traversal - ${filePath}`));
            }

            const buff = this._state.get(pathname);
            const stream = new Readable({
                read() {
                    buff.forEach((item) => {
                        this.push(item);
                    });
                    this.push(null);
                }
            });

            resolve(stream);

            // TODO: Handle if stream never opens or errors, set a timeout which will reject with an error
        });
    }

    delete(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                return reject(new Error(`Directory traversal - ${filePath}`));
            }

            this._state.delete(pathname);
            resolve();
        });
    }

    exist(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                return reject(new Error(`Directory traversal - ${filePath}`));
            }

            if (this._state.has(filePath)) return resolve();
            reject(new Error('File does not exist'));
        });
    }
}
module.exports = SinkTest;
