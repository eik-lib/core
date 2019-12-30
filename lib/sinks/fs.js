'use strict';

const { ReadFile } = require('@eik/common');
const rimraf = require('rimraf');
const mime = require('mime/lite');
const path = require('path');
const fs = require('fs');

const { etagFromFsStat } = require('../utils/utils');
const conf = require('../utils/defaults');

/**
 * A sink for persisting files to local file system
 *
 * @class SinkFS
 */

const SinkFS = class SinkFS {
    constructor(config = {}) {
        this._config = { ...conf, ...config};
    }

    write(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._config.sinkFsRootPath, filePath);

            if (pathname.indexOf(this._config.sinkFsRootPath) !== 0) {
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            const dir = path.dirname(pathname);

            fs.mkdir(
                dir,
                {
                    recursive: true,
                },
                error => {
                    if (error) {
                        reject(
                            new Error(`Could not create directory - ${dir}`),
                        );
                        return;
                    }

                    const stream = fs.createWriteStream(pathname, {
                        autoClose: true,
                        emitClose: true,
                    });

                    resolve(stream);
                },
            );
        });
    }

    read(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._config.sinkFsRootPath, filePath);

            if (pathname.indexOf(this._config.sinkFsRootPath) !== 0) {
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            const closeFd = fd => {
                fs.close(fd, () => {
                    // TODO: Log errors
                });
            }

            fs.open(pathname, 'r', (error, fd) => {
                if (error) {
                    reject(error);
                    return;
                };

                fs.fstat(fd, (err, stat) => {
                    if (err) {
                        closeFd(fd);
                        reject(err);
                        return;
                    };

                    if (!stat.isFile()) {
                        closeFd(fd);
                        reject(new Error(`Not a file - ${pathname}`));
                        return;
                    }

                    const mimeType = mime.getType(pathname) || 'application/octet-stream';
                    const etag = etagFromFsStat(stat);

                    const file = new ReadFile({
                        mimeType,
                        etag,
                    });

                    file.stream = fs.createReadStream(pathname, {
                        autoClose: true,
                        fd,
                    });

                    resolve(file);
                });

            });
        });
    }

    delete(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._config.sinkFsRootPath, filePath);

            if (pathname.indexOf(this._config.sinkFsRootPath) !== 0) {
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            rimraf(pathname, error => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }

    exist(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._config.sinkFsRootPath, filePath);

            if (pathname.indexOf(this._config.sinkFsRootPath) !== 0) {
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            fs.stat(pathname, (error, stat) => {
                if (stat && stat.isFile()) {
                    resolve();
                    return;
                }
                if (error) {
                    reject(error);
                    return;
                }
                reject();
            });
        });
    }

    get [Symbol.toStringTag]() {
        return 'SinkFS';
    }
}
module.exports = SinkFS;
