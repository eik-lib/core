'use strict';

const rimraf = require('rimraf');
const path = require('path');
const fs = require('fs');
const os = require('os');

const DEFAULT_DIR = path.join(os.tmpdir(), '/asset-pipe');

/**
 * A sink for persisting files to local file system
 *
 * @class SinkFS
 */

class SinkFS {
    constructor(dir = DEFAULT_DIR) {
        this._dir = dir;
    }

    write(filePath) {
        const pathname = path.join(this._dir, filePath);
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
        const pathname = path.join(this._dir, filePath);
        return fs.createReadStream(pathname, {
            autoClose: true,
            emitClose: true,
        });
    }

    delete(filePath) {
        const pathname = path.join(this._dir, filePath);
        const dir = path.dirname(pathname);

        return new Promise((resolve, reject) => {
            rimraf(dir, error => {
                if (error) return reject(error);
                return resolve();
            });
        });
    }
}
module.exports = SinkFS;
