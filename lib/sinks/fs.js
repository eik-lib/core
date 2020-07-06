'use strict';

const { ReadFile } = require('@eik/common');
const Metrics = require('@metrics/client');
const rimraf = require('rimraf');
const Sink = require('@eik/sink');
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
        this._metrics = new Metrics();
        this._counter = this._metrics.counter({
            name: 'eik_core_sink_fs',
            description: 'Counter measuring access to the file system storage sink',
            labels: {
                success: true,
            },
        });
    }

    get metrics() {
        return this._metrics;
    }

    write(filePath, contentType) {
        return new Promise((resolve, reject) => {
            try {
                super.constructor.validateFilePath(filePath);
                super.constructor.validateContentType(contentType);
            } catch (error) {
                this._counter.inc({ 
                    labels: { 
                        operation: 'write',
                        success: false, 
                    } 
                });
                reject(error);
                return;
            }

            const pathname = path.join(this._config.sinkFsRootPath, filePath);

            if (pathname.indexOf(this._config.sinkFsRootPath) !== 0) {
                this._counter.inc({ 
                    labels: { 
                        operation: 'write',
                        success: false, 
                    } 
                });
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            this._counter.inc({ 
                labels: { 
                    operation: 'write',
                } 
            });

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
            try {
                super.constructor.validateFilePath(filePath);
            } catch (error) {
                this._counter.inc({ 
                    labels: { 
                        operation: 'read',
                        success: false, 
                    } 
                });
                reject(error);
                return;
            }

            const pathname = path.join(this._config.sinkFsRootPath, filePath);

            if (pathname.indexOf(this._config.sinkFsRootPath) !== 0) {
                this._counter.inc({ 
                    labels: { 
                        operation: 'read',
                        success: false, 
                    } 
                });
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            this._counter.inc({ 
                labels: { 
                    operation: 'read',
                } 
            });

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
        return new Promise((resolve, reject) => {
            try {
                super.constructor.validateFilePath(filePath);
            } catch (error) {
                this._counter.inc({ 
                    labels: { 
                        operation: 'delete',
                        success: false, 
                    } 
                });
                reject(error);
                return;
            }

            const pathname = path.join(this._config.sinkFsRootPath, filePath);

            if (pathname.indexOf(this._config.sinkFsRootPath) !== 0) {
                this._counter.inc({ 
                    labels: { 
                        operation: 'delete',
                        success: false, 
                    } 
                });
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            this._counter.inc({ 
                labels: { 
                    operation: 'delete',
                } 
            });

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
            try {
                super.constructor.validateFilePath(filePath);
            } catch (error) {
                this._counter.inc({ 
                    labels: { 
                        operation: 'exist',
                        success: false, 
                    } 
                });
                reject(error);
                return;
            }

            const pathname = path.join(this._config.sinkFsRootPath, filePath);

            if (pathname.indexOf(this._config.sinkFsRootPath) !== 0) {
                this._counter.inc({ 
                    labels: { 
                        operation: 'exist',
                        success: false, 
                    } 
                });
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            this._counter.inc({ 
                labels: { 
                    operation: 'exist',
                } 
            });

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
