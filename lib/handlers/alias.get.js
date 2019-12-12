'use strict';

const { validators } = require('@eik/common');
const HttpError = require('http-errors');
const abslog = require('abslog');
const Metrics = require('@metrics/client');

const { createURIToTargetOfAlias } = require('../utils/path-builders-uri');
const { createFilePathToAlias } = require('../utils/path-builders-fs');
const HttpOutgoing = require('../classes/http-outgoing');
const utils = require('../utils/utils');
const conf = require('../utils/defaults');

const AliasGet = class AliasGet {
    constructor(sink, config = {}, logger) {
        this._config = { ...conf, ...config };
        this._sink = sink;
        this._log = abslog(logger);
        this._metrics = new Metrics();
        this._histogram = this._metrics.histogram({
            name: 'eik_core_alias_get_handler',
            description:
                'Histogram measuring time taken in @eik/core AliasGet handler method',
            labels: {
                success: true,
            },
        });
    }

    get metrics() {
        return this._metrics;
    }

    async handler(req, org, type, name, alias, extra) {
        const end = this._histogram.timer();

        try {
            validators.alias(alias);
            validators.extra(extra);
            validators.name(name);
            validators.type(type);
            validators.org(org);
        } catch (error) {
            this._log.debug(`alias:get - Validation failed - ${error.message}`);
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: 404 } });
            throw e;
        }

        const path = createFilePathToAlias({ org, type, name, alias });

        try {
            const obj = await utils.readJSON(this._sink, path);
            const location = createURIToTargetOfAlias({ extra, ...obj });

            const outgoing = new HttpOutgoing();
            outgoing.mimeType = 'application/json';
            outgoing.statusCode = 303;
            outgoing.location = location;

            this._log.debug(`alias:get - Alias found - Pathname: ${path}`);

            end({ labels: { status: outgoing.statusCode } });

            return outgoing;
        } catch (error) {
            this._log.debug(`alias:get - Alias not found - Pathname: ${path}`);
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }
    }
};
module.exports = AliasGet;
