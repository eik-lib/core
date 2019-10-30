'use strict';

const HttpError = require('http-errors');
const { validators } = require('@asset-pipe/common');
const HttpOutgoing = require('../classes/http-outgoing');
const Alias = require('../classes/alias');

const handler = async (sink, req, org, type, name, alias) => {
    try {
        validators.alias(alias);
        validators.name(name);
        validators.type(type);
        validators.org(org);
    } catch (error) {
        throw new HttpError(400, 'Bad request');
    }

    try {
        const path = Alias.buildPath(org, type, name, alias);
        await sink.delete(path);
    } catch (error) {
        return new HttpError(502, 'Bad gateway');
    }

    const outgoing = new HttpOutgoing();
    outgoing.statusCode = 204;
    return outgoing;
};
module.exports.handler = handler;
