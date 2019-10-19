'use strict';

const HttpOutgoing = require('../classes/http-outgoing');
const validators = require('../utils/validators');
const httpError = require('http-errors');
const Alias = require('../classes/alias');
const utils = require('../utils/utils');

const handler = async (sink, req, org, type, name, alias, extra) => {
    try {
        validators.alias(alias);
        validators.extra(extra);
        validators.name(name);
        validators.org(org);
    } catch (error) {
        throw new httpError(404, 'Not found');
    }

    const path = Alias.buildPath(org, type, name, alias);

    try {
        await sink.exist(path);
    } catch (error) {
        throw new httpError(404, 'Not found');
    }

    try {
        const obj = await utils.readJSON(sink, path);

        const location = Alias.buildPathname(obj.org, obj.type, obj.name, obj.version, extra);

        const outgoing = new HttpOutgoing();
        outgoing.mimeType = 'application/json';
        outgoing.statusCode = 302;
        outgoing.location = location;

        return outgoing;
    } catch(error) {
        throw new httpError(500, 'Internal server error');
    }
};
module.exports.handler = handler;
