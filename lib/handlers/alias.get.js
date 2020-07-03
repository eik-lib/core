'use strict';

const { validators } = require('@eik/common');
const originalUrl = require('original-url');
const HttpError = require('http-errors');
const abslog = require('abslog');
const Metrics = require('@metrics/client');

const { createURIToTargetOfAlias } = require('../utils/path-builders-uri');
const { createFilePathToAlias } = require('../utils/path-builders-fs');
const HttpOutgoing = require('../classes/http-outgoing');
const utils = require('../utils/utils');
const config = require('../utils/defaults');

const AliasGet = class AliasGet {
    constructor({
        organizations,
        cacheControl,
        logger,
        sink,
    } = {}) {
        this._organizations = organizations || config.organizations;
        this._cacheControl = cacheControl || 'public, max-age=1200';
        this._sink = sink;
        this._log = abslog(logger);
        this._metrics = new Metrics();
        this._histogram = this._metrics.histogram({
            name: 'eik_core_alias_get_handler',
            description:
                'Histogram measuring time taken in @eik/core AliasGet handler method',
            labels: {
                success: true,
                type: 'unknown',
            },
            buckets: [
                0.005,
                0.01,
                0.06,
                0.1,
                0.6,
                1.0,
                2.0,
                4.0,
            ],
        });
        this._orgRegistry = new Map(this._organizations);
    }

    get metrics() {
        return this._metrics;
    }

    async handler(req, type, name, alias, extra) {
        const end = this._histogram.timer();

        try {
            validators.alias(alias);
            validators.extra(extra);
            validators.name(name);
            validators.type(type);
        } catch (error) {
            this._log.debug(`alias:get - Validation failed - ${error.message}`);
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        const url = originalUrl(req);
        const org = this._orgRegistry.get(url.hostname);

        if (!org) {
            this._log.info(`alias:get - Hostname does not match a configured organization - ${url.hostname}`);
            const e = new HttpError.InternalServerError();
            end({ labels: { success: false, status: e.status, type } });
            throw e;
        }

        const path = createFilePathToAlias({ org, type, name, alias });

        try {
            const obj = await utils.readJSON(this._sink, path);
            const location = createURIToTargetOfAlias({ extra, ...obj });

            const outgoing = new HttpOutgoing();
            outgoing.cacheControl = this._cacheControl;
            outgoing.statusCode = 302;
            outgoing.location = location;

            this._log.debug(`alias:get - Alias found - Pathname: ${path}`);

            end({ labels: { status: outgoing.statusCode, type } });

            return outgoing;
        } catch (error) {
            this._log.debug(`alias:get - Alias not found - Pathname: ${path}`);
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: e.status, type } });
            throw e;
        }
    }
};
module.exports = AliasGet;
