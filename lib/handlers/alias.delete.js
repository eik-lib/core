'use strict';

const HttpOutgoing = require('../classes/http-outgoing');
const Alias = require('../classes/alias');

const handler = async (sink, req, org, type, name, alias) => {
    if (typeof org !== 'string' || org === '') {
        throw new TypeError(
            ':org is a required url parameter and must be a string',
        );
    }

    if (typeof type !== 'string' || type === '') {
        throw new TypeError(
            ':type is a required url parameter and must be a string',
        );
    }

    if (typeof name !== 'string' || name === '') {
        throw new TypeError(
            ':name is a required url parameter and must be a string',
        );
    }

    if (typeof alias !== 'string' || alias === '') {
        throw new TypeError(
            ':alias is a required url parameter and must be a string',
        );
    }

    const path = Alias.buildPath(org, type, name, alias);

    // TODO; try/catch
    await sink.delete(path);

    const outgoing = new HttpOutgoing();
    outgoing.mimeType = 'plain/text';
    outgoing.statusCode = 204;
    outgoing.push(null);

    return outgoing;
};
module.exports.handler = handler;
