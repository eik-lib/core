'use strict';

const rimraf = require('rimraf');
const path = require('path');
const fs = require('fs');
const os = require('os');

const DEFAULT_ROOT_PATH = path.join(os.tmpdir(), '/asset-pipe');

/**
 * A sink for persisting files to local file system
 *
 * @class SinkFS
 */

class SinkFS {
    constructor({ rootPath = DEFAULT_ROOT_PATH } = {}) {
        this._rootPath = rootPath;
    }

    write(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                return reject(new Error(`Directory traversal - ${filePath}`));
            }

            const dir = path.dirname(pathname);

            fs.mkdir(dir, {
                recursive: true,
            }, (error) => {
                if (error) {
                    return reject(new Error(`Could not create directory - ${dir}`));
                }

                const stream = fs.createWriteStream(pathname, {
                    autoClose: true,
                    emitClose: true,
                });

                resolve(stream);
            });

            // TODO: Handle if stream never opens or errors, set a timeout which will reject with an error
        });
    }

    read(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                return reject(new Error(`Directory traversal - ${filePath}`));
            }

            let streamClosed = true;

            const stream = fs.createReadStream(pathname, {
                autoClose: true,
                emitClose: true,
            });

            stream.on('open', () => {
                streamClosed = false;
                resolve(stream);
            });

            stream.on('error', (error) => {
                if (streamClosed) {
                    reject(error);
                }
            });

            // TODO: Handle if stream never opens or errors, set a timeout which will reject with an error
        });
    }

    delete(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._rootPath, filePath);
            const dir = path.dirname(pathname);

            if (pathname.indexOf(this._rootPath) !== 0) {
                return reject(new Error(`Directory traversal - ${filePath}`));
            }

            rimraf(dir, error => {
                if (error) return reject(error);
                return resolve();
            });
        });
    }

    exist(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                return reject(new Error(`Directory traversal - ${filePath}`));
            }

            fs.stat(pathname, (error, stat) => {
                if (stat.isFile()) return resolve();
                if (error) return reject(error);
                reject()
            });
        });
    }
}
module.exports = SinkFS;
