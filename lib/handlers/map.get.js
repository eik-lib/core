'use strict';

const HttpError = require('http-errors');
const { validators } = require('@asset-pipe/common');
const HttpOutgoing = require('../classes/http-outgoing');
const ImportMap = require('../classes/import-map');

const handler = async (sink, req, org, name, version) => {
    try {
        validators.version(version);
        validators.name(name);
        validators.org(org);
    } catch (error) {
        throw new HttpError(404, 'Not found');
    }

    const path = ImportMap.buildPath(org, name, version);

    try {
        const outgoing = new HttpOutgoing();
        outgoing.mimeType = 'application/json';

        const stream = await sink.read(path);
        outgoing.stream = stream;

        return outgoing;
    } catch (error) {
        throw new HttpError(404, 'Not found');
    }
};
module.exports.handler = handler;
