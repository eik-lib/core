'use strict';

const { validators } = require('@eik/common');
const originalUrl = require('original-url');
const HttpError = require('http-errors');
const Metrics = require('@metrics/client');
const abslog = require('abslog');

const { createFilePathToVersion } = require('../utils/path-builders-fs');
const HttpOutgoing = require('../classes/http-outgoing');
const config = require('../utils/defaults');

const VersionsGet = class VersionsGet {
    constructor({
        organizations,
        cacheControl,
        logger,
        sink,
        etag,
    } = {}) {
        this._organizations = organizations || config.organizations;
        this._cacheControl = cacheControl || 'no-cache';
        this._sink = sink;
        this._etag = etag || config.etag;
        this._log = abslog(logger);

        this._metrics = new Metrics();
        this._histogram = this._metrics.histogram({
            name: 'eik_core_versions_get_handler',
            description:
                'Histogram measuring time taken in @eik/core VersionsGet handler method',
            labels: {
                success: true,
            },
        });
        this._orgRegistry = new Map(this._organizations);
    }

    get metrics() {
        return this._metrics;
    }

    async handler(req, type, name) {
        const end = this._histogram.timer();

        try {
            validators.name(name);
            validators.type(type);
        } catch (error) {
            this._log.debug(
                `pkg:latest - Validation failed - ${error.message}`,
            );
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        const url = originalUrl(req);
        const org = this._orgRegistry.get(url.hostname);

        if (!org) {
            this._log.info(`pkg:latest - Hostname does not match a configured organization - ${url.hostname}`);
            const e = new HttpError.InternalServerError();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }
        const path = createFilePathToVersion({ org, type, name });

        try {
            const file = await this._sink.read(path);
            const outgoing = new HttpOutgoing();
            outgoing.cacheControl = this._cacheControl;
            outgoing.mimeType = 'application/json';

            if (this._etag) {
                outgoing.etag = file.etag;
            }

            if (
                this._etag &&
                req.headers['if-none-match'] === file.etag
            ) {
                outgoing.statusCode = 304;
                file.stream.destroy();
            } else {
                outgoing.statusCode = 200;
                outgoing.stream = file.stream;
            }

            this._log.debug(
                `pkg:latest - Package log found - Pathname: ${path}`,
            );

            end({ labels: { status: outgoing.statusCode } });

            return outgoing;
        } catch (error) {
            this._log.debug(
                `pkg:latest - Package log found - Pathname: ${path}`,
            );
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }
    }
};
module.exports = VersionsGet;
