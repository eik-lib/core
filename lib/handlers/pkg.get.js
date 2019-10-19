'use strict';

const HttpOutgoing = require('../classes/http-outgoing');
const validators = require('../utils/validators');
const httpError = require('http-errors');
const Asset = require('../classes/asset');

const handler = async (sink, req, org, name, version, extra) => {
    try {
        validators.version(version);
        validators.extra(extra);
        validators.name(name);
        validators.org(org);
    } catch (error) {
        throw new httpError(404, 'Not found');
    }

    const asset = new Asset({
        version,
        extra,
        name,
        org,
    });

    try {
        const outgoing = new HttpOutgoing();
        outgoing.mimeType = asset.mimeType;

        const stream = await sink.read(asset.path);
        stream.pipe(outgoing);

        return outgoing;
    } catch (error) {
        throw new httpError(404, 'Not found');
    }
};
module.exports.handler = handler;
