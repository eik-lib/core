'use strict';

const { validators } = require('@eik/common');
const HttpError = require('http-errors');
const abslog = require('abslog');

const { createFilePathToAlias } = require('../utils/path-builders-fs');
const HttpOutgoing = require('../classes/http-outgoing');
const conf = require('../utils/defaults');

const AliasDel = class AliasDel {
    constructor(sink, config = {}, logger) {
        this._config = { ...conf, ...config};
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
            this._log.info(`alias:del - Validation failed - ${error.message}`);
            throw new HttpError.NotFound();
        }

        const path = createFilePathToAlias({ org, type, name, alias });
        const exist = await this._exist(path);
        if (!exist) {
            this._log.info(`alias:del - Alias does not exists - Org: ${org} - Type: ${type} - Name: ${name} - Alias: ${alias}`);
            throw new HttpError.NotFound();
        }

        try {
            this._log.info(`alias:del - Start deleting alias from sink - Pathname: ${path}`);
            await this._sink.delete(path);
        } catch (error) {
            this._log.error(`alias:del - Failed deleting alias from sink - Pathname: ${path}`);
            this._log.trace(error);
            return new HttpError.BadGateway();
        }

        this._log.info(`alias:del - Successfully deleted alias from sink - Pathname: ${path}`);

        const outgoing = new HttpOutgoing();
        outgoing.statusCode = 204;
        return outgoing;
    }
}
module.exports = AliasDel;
