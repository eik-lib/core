'use strict';

const { validators } = require('@asset-pipe/common');
const HttpError = require('http-errors');
const abslog = require('abslog');
const HttpOutgoing = require('../classes/http-outgoing');
const pathnames = require('../utils/pathnames');
const paths = require('../utils/paths');
const utils = require('../utils/utils');

class AliasGet {
    constructor(sink, config = {}, logger) {
        this._config = config;
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

        const path = paths.alias({ org, type, name, alias });

        try {
            const obj = await utils.readJSON(this._sink, path);
            const location = pathnames.aliasTarget(Object.assign({ extra }, obj));

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
