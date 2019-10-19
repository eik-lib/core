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
    constructor({
        rootPath = DEFAULT_ROOT_PATH
    } = {}) {
        this._rootPath = rootPath;
    }

    write(filePath) {
        const pathname = path.join(this._rootPath, filePath);
        const dir = path.dirname(pathname);

        // TODO: make this non blocking without returning a promise from write
        fs.mkdirSync(dir, {
            recursive: true,
        });

        return fs.createWriteStream(pathname, {
            autoClose: true,
            emitClose: true,
        });
    }

    read(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                return reject(new Error(`Directory traversal - ${filePath}`));
            }

            const stream = fs.createReadStream(pathname, {
                autoClose: true,
                emitClose: true,
            });

            resolve(stream);
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
