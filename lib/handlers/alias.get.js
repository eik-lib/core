'use strict';

const { validators } = require('@asset-pipe/common');
const HttpError = require('http-errors');
const abslog = require('abslog');

const { createURIToTargetOfAlias } = require('../utils/path-builders-uri');
const { createFilePathToAlias } = require('../utils/path-builders-fs');
const HttpOutgoing = require('../classes/http-outgoing');
const utils = require('../utils/utils');
const conf = require('../utils/defaults');

const AliasGet = class AliasGet {
    constructor(sink, config = {}, logger) {
        this._config = { ...conf, ...config};
        this._sink = sink;
        this._log = abslog(logger);
    }

    async handler (req, org, type, name, alias, extra) {
        try {
            validators.alias(alias);
            validators.extra(extra);
            validators.name(name);
            validators.type(type);
            validators.org(org);
        } catch (error) {
            throw new HttpError.NotFound();
        }

        const path = createFilePathToAlias({ org, type, name, alias });

        try {
            const obj = await utils.readJSON(this._sink, path);
            const location = createURIToTargetOfAlias({extra, ...obj});

            const outgoing = new HttpOutgoing();
            outgoing.mimeType = 'application/json';
            outgoing.statusCode = 303;
            outgoing.location = location;

            return outgoing;
        } catch (error) {
            throw new HttpError.NotFound();
        }
    }
}
module.exports = AliasGet;
