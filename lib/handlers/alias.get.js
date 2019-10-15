'use strict';

const HttpOutgoing = require('../classes/http-outgoing');
const Alias = require('../classes/alias');
const utils = require('../utils/utils');

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

const handler = async (sink, req, org, type, name, alias, extra) => {
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

    if (typeof alias !== 'string' || alias === '') {
        throw new TypeError(
            ':alias is a required url parameter and must be a string'
        );
    }

    const path = Alias.buildPath(org, type, name, alias);

    let obj = {};
    try {
        obj = await utils.readJSON(sink, path);
    } catch(error) {
        // TODO; log error?
    }

    const location = Alias.buildPathname(obj.org, obj.type, obj.name, obj.version, extra);

    const outgoing = new HttpOutgoing();
    outgoing.mimeType = 'application/json';
    outgoing.statusCode = 302;
    outgoing.location = location;

    return outgoing;

};
module.exports.handler = handler;
