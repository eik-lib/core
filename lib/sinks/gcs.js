'use strict';

const { Storage } = require('@google-cloud/storage');

/**
 * A sink for uploading files to Google Cloud Storage
 * https://googleapis.dev/nodejs/storage/latest/
 *
 * @class SinkGCS
 */

class SinkGCS {
    constructor() {
        this._storage = new Storage();
        this._bucket = this._storage.bucket('asset_pipe_v3');
    }

    write(filePath, contentType) {
        const src = this._bucket.file(filePath);
        const gcsStream = src.createWriteStream({
            resumable: false,
            metadata: {
                cacheControl: 'public, max-age=31536000',
                contentType,
            },
            gzip: true,
        });

        gcsStream.on('error', error => {
            // eslint-disable-next-line no-console
            console.log('ERROR', error);
        });

        gcsStream.on('finish', () => {
            // console.log('END');
        });

        return gcsStream;
    }

    read(filePath) {
        const src = this._bucket.file(filePath);
        const gcsStream = src.createReadStream();

        gcsStream.on('error', error => {
            // eslint-disable-next-line no-console
            console.log('ERROR', error);
        });

        gcsStream.on('response', () => {
            // console.log('RESPONSE', response);
        });

        gcsStream.on('end', () => {
            // console.log('END');
        });

        return gcsStream;
    }

    delete(filePath) {
        const src = this._bucket.file(filePath);
        return new Promise((resolve, reject) => {
            src.delete(error => {
                if (error) return reject(error);
                return resolve();
            });
        });
    }

    exist(filePath) {
        const src = this._bucket.file(filePath);
        return new Promise((resolve, reject) => {
            src.exists(error => {
                if (error) return reject(error);
                return resolve();
            });
        });
    }
}
module.exports = SinkGCS;
