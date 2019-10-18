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
        const pathname = path.join(this._rootPath, filePath);
        return fs.createReadStream(pathname, {
            autoClose: true,
            emitClose: true,
        });
    }

    delete(filePath) {
        const pathname = path.join(this._rootPath, filePath);
        const dir = path.dirname(pathname);

        return new Promise((resolve, reject) => {
            rimraf(dir, error => {
                if (error) return reject(error);
                return resolve();
            });
        });
    }

    exist(filePath) {
        const pathname = path.join(this._rootPath, filePath);
        return new Promise((resolve, reject) => {
            fs.access(pathname, fs.F_OK, error => {
                if (error) return reject(error);
                return resolve();
            });
        });
    }
}
module.exports = SinkFS;
