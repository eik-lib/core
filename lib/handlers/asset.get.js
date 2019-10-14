'use strict';

const HttpOutgoing = require('../classes/http-outgoing');
const Asset = require('../classes/asset');

const params = {
    type: 'object',
    properties: {
        alias: {
          type: 'string',
          minLength: 1,
          maxLength: 64,
          pattern: "^[a-zA-Z0-9_-]*$"
        },
        type: { type: 'string' },
        name: { type: 'string' },
        org: { type: 'string' },
    }
};
module.exports.params = params;

const handler = (sink, req, org, type, name, version, extra) => {
    if (typeof org !== 'string' || org === '') {
        throw new TypeError(
            ':org is a required url parameter and must be a string'
        );
    }

    if (typeof type !== 'string' || type === '') {
        throw new TypeError(
            ':type is a required url parameter and must be a string'
        );
    }

    if (typeof name !== 'string' || name === '') {
        throw new TypeError(
            ':name is a required url parameter and must be a string'
        );
    }

    if (typeof version !== 'string' || version === '') {
        throw new TypeError(
            ':version is a required url parameter and must be a string'
        );
    }

    return new Promise((resolve, reject) => {
        const asset = new Asset({
            version,
            extra,
            name,
            type,
            org,
        });

        if (asset.supported) {
            const outgoing = new HttpOutgoing();
            outgoing.mimeType = asset.mimeType;

            const stream = sink.read(asset.path);
            stream.pipe(outgoing);

            resolve(outgoing);

            return;
        }

        reject(new Error('Not found'));
    });
};
module.exports.handler = handler;
