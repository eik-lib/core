'use strict';

const { ReadFile, Sink } = require('@eik/common');
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

const SinkFS = class SinkFS extends Sink {
    constructor(config = {}) {
        super();
        this._config = { ...conf, ...config};
    }

    write(filePath, contentType) {
        const file = super.constructor.validateFilePath(filePath);
        super.constructor.validateContentType(contentType);

        return new Promise((resolve, reject) => {
            const pathname = path.join(this._config.sinkFsRootPath, file);

            if (pathname.indexOf(this._config.sinkFsRootPath) !== 0) {
                reject(new Error(`Directory traversal - ${file}`));
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
        const file = super.constructor.validateFilePath(filePath);

        return new Promise((resolve, reject) => {
            const pathname = path.join(this._config.sinkFsRootPath, file);

            if (pathname.indexOf(this._config.sinkFsRootPath) !== 0) {
                reject(new Error(`Directory traversal - ${file}`));
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

                    const obj = new ReadFile({
                        mimeType,
                        etag,
                    });

                    obj.stream = fs.createReadStream(pathname, {
                        autoClose: true,
                        fd,
                    });

                    resolve(obj);
                });

            });
        });
    }

    delete(filePath) {
        const file = super.constructor.validateFilePath(filePath);

        return new Promise((resolve, reject) => {
            const pathname = path.join(this._config.sinkFsRootPath, file);

            if (pathname.indexOf(this._config.sinkFsRootPath) !== 0) {
                reject(new Error(`Directory traversal - ${file}`));
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
        const file = super.constructor.validateFilePath(filePath);

        return new Promise((resolve, reject) => {
            const pathname = path.join(this._config.sinkFsRootPath, file);

            if (pathname.indexOf(this._config.sinkFsRootPath) !== 0) {
                reject(new Error(`Directory traversal - ${file}`));
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
