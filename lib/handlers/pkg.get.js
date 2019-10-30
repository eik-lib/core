'use strict';

const HttpError = require('http-errors');
const { validators } = require('@asset-pipe/common');
const HttpOutgoing = require('../classes/http-outgoing');
const Asset = require('../classes/asset');

const handler = async (sink, req, org, name, version, extra) => {
    try {
        validators.version(version);
        validators.extra(extra);
        validators.name(name);
        validators.org(org);
    } catch (error) {
        throw new HttpError(404, 'Not found');
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
        outgoing.stream = stream;

        return outgoing;
    } catch (error) {
        throw new HttpError(404, 'Not found');
    }
};
module.exports.handler = handler;
