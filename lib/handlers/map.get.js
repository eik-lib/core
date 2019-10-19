'use strict';

const HttpOutgoing = require('../classes/http-outgoing');
const validators = require('../utils/validators');
const httpError = require('http-errors');
const ImportMap = require('../classes/import-map');

const handler = async (sink, req, org, name, version) => {
    try {
        validators.version(version);
        validators.name(name);
        validators.org(org);
    } catch (error) {
        throw new httpError(404, 'Not found');
    }

    const path = ImportMap.buildPath(org, name, version);

    try {
        const outgoing = new HttpOutgoing();
        outgoing.mimeType = 'application/json';

        const stream = await sink.read(path);
        stream.pipe(outgoing);

        return outgoing;
    } catch (error) {
        throw new httpError(404, 'Not found');
    }
};
module.exports.handler = handler;
