'use strict';

const HttpOutgoing = require('../classes/http-outgoing');
const validators = require('../utils/validators');
const httpError = require('http-errors');
const Asset = require('../classes/asset');

const handler = async (sink, req, org, name, version, extra) => {

    console.log('HHHHHHHHH', org, name, version, extra);

    validators.version(version);
    validators.name(name);
    validators.org(org);

    const asset = new Asset({
        version,
        extra,
        name,
        org,
    });



    try {
        await sink.exist(asset.path);
    } catch (error) {
        throw new httpError(404, 'Not found');
    }

    if (asset.supported) {
        const outgoing = new HttpOutgoing();
        outgoing.mimeType = asset.mimeType;

        const stream = sink.read(asset.path);

        stream.on('error', (error) => {
            // reject(new Error('Not found'));
        });

        stream.pipe(outgoing);

        return outgoing;
    }
};
module.exports.handler = handler;
