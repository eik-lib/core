'use strict';

const HttpOutgoing = require('../classes/http-outgoing');
const ImportMap = require('../classes/import-map');

const handler = async (sink, req, org, name) => {
    if (typeof org !== 'string' || org === '') {
        throw new TypeError(
            ':org is a required url parameter and must be a string'
        );
    }

    if (typeof name !== 'string' || name === '') {
        throw new TypeError(
            ':name is a required url parameter and must be a string'
        );
    }

    const path = ImportMap.buildPath(org, name);

    const outgoing = new HttpOutgoing();
    outgoing.mimeType = 'application/json';

    const stream = sink.read(path);
    stream.pipe(outgoing);

    return outgoing;
};
module.exports.handler = handler;
