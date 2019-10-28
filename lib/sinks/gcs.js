'use strict';

const { Storage } = require('@google-cloud/storage');
const path = require('path');

const DEFAULT_ROOT_PATH = 'asset-pipe';

/**
 * A sink for uploading files to Google Cloud Storage
 * https://googleapis.dev/nodejs/storage/latest/
 *
 * @class SinkGCS
 */

class SinkGCS {
    constructor({ rootPath = DEFAULT_ROOT_PATH } = {}) {
        this._rootPath = rootPath;
        this._storage = new Storage();
        this._bucket = this._storage.bucket('asset_pipe_v3');
    }

    write(filePath, contentType) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            const src = this._bucket.file(pathname);
            const gcsStream = src.createWriteStream({
                resumable: false,
                metadata: {
                    cacheControl: 'public, max-age=31536000',
                    contentType,
                },
                gzip: true,
            });

            gcsStream.on('error', () => {
                // eslint-disable-next-line no-console
                // console.log('ERROR', error);
            });

            gcsStream.on('finish', () => {
                // console.log('END');
            });

            resolve(gcsStream);
        });
    }

    read(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            let streamClosed = true;

            const src = this._bucket.file(pathname);
            const gcsStream = src.createReadStream();

            gcsStream.on('readable', () => {
                gcsStream.read();
            });

            gcsStream.on('error', error => {
                if (streamClosed) {
                    reject(error);
                }
            });

            gcsStream.on('response', (response) => {
                if (response.statusCode === 200) {
                    streamClosed = false;
                    resolve(gcsStream);

                }
            });
        });
    }

    delete(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }
            const src = this._bucket.file(pathname);

            src.delete(error => {
                if (error) return reject(error);
                return resolve();
            });
        });
    }

    exist(filePath) {
        return new Promise((resolve, reject) => {
            const pathname = path.join(this._rootPath, filePath);

            if (pathname.indexOf(this._rootPath) !== 0) {
                reject(new Error(`Directory traversal - ${filePath}`));
                return;
            }

            const src = this._bucket.file(pathname);

            src.exists(error => {
                if (error) return reject(error);
                return resolve();
            });
        });
    }
}
module.exports = SinkGCS;
