'use strict';

const { validators } = require('@asset-pipe/common');
const HttpError = require('http-errors');
const abslog = require('abslog');

const { createFilePathToAlias } = require('../utils/path-builders-fs');
const HttpOutgoing = require('../classes/http-outgoing');

class AliasDel {
    constructor(sink, config = {}, logger) {
        this._config = config;
        this._sink = sink;
        this._log = abslog(logger);
    }

    async _exist (path = '') {
        try {
            await this._sink.exist(path);
            return true;
        } catch (error) {
            return false;
        }
    }

    async handler (req, org, type, name, alias) {
        try {
            validators.alias(alias);
            validators.name(name);
            validators.type(type);
            validators.org(org);
        } catch (error) {
            throw new HttpError.NotFound();
        }

        const path = createFilePathToAlias({ org, type, name, alias });
        const exist = await this._exist(path);
        if (!exist) {
            throw new HttpError.NotFound();
        }

        try {
            await this._sink.delete(path);
        } catch (error) {
            return new HttpError.BadGateway();
        }

        const outgoing = new HttpOutgoing();
        outgoing.statusCode = 204;
        return outgoing;
    }
}
module.exports = AliasDel;
