'use strict';

const HttpError = require('http-errors');
const { validators } = require('@asset-pipe/common');
const HttpOutgoing = require('../classes/http-outgoing');
const Alias = require('../classes/alias');
const utils = require('../utils/utils');

const handler = async (sink, req, org, type, name, alias, extra) => {
    try {
        validators.alias(alias);
        validators.extra(extra);
        validators.name(name);
        validators.type(type);
        validators.org(org);
    } catch (error) {
        throw new HttpError(404, 'Not found');
    }

    const path = Alias.buildPath(org, type, name, alias);

    try {
        const obj = await utils.readJSON(sink, path);

        const location = Alias.buildPathname(
            obj.org,
            obj.type,
            obj.name,
            obj.version,
            extra,
        );

        const outgoing = new HttpOutgoing();
        outgoing.mimeType = 'application/json';
        outgoing.statusCode = 303;
        outgoing.location = location;

        return outgoing;
    } catch (error) {
        throw new HttpError(404, 'Not found');
    }
};
module.exports.handler = handler;
