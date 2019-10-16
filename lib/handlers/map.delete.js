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

        // TODO; try/catch
        await sink.delete(path);

        const outgoing = new HttpOutgoing();
        outgoing.mimeType = 'plain/text';
        outgoing.statusCode = 204;
        outgoing.push(null);

        return outgoing;
};
module.exports.handler = handler;
