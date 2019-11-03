'use strict';

const { validators } = require('@asset-pipe/common');
const HttpError = require('http-errors');
const abslog = require('abslog');
const HttpOutgoing = require('../classes/http-outgoing');
const Alias = require('../classes/alias');

class AliasDel {
    constructor(sink, config = {}, logger) {
        this._config = config;
        this._sink = sink;
        this._log = abslog(logger);
    }

    async handler (req, org, type, name, alias) {
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
            await this._sink.delete(path);
        } catch (error) {
            return new HttpError(502, 'Bad gateway');
        }

        const outgoing = new HttpOutgoing();
        outgoing.statusCode = 204;
        return outgoing;
    }
}
module.exports = AliasDel;
