'use strict';

const { validators } = require('@eik/common');
const HttpError = require('http-errors');
const abslog = require('abslog');
const Metrics = require('@metrics/client');

const { createFilePathToVersion } = require('../utils/path-builders-fs');
const HttpOutgoing = require('../classes/http-outgoing');
const conf = require('../utils/defaults');

const VersionsGet = class VersionsGet {
    constructor(sink, config = {}, logger) {
        this._config = { ...conf, ...config };
        this._sink = sink;
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
    }

    get metrics() {
        return this._metrics;
    }

    async handler(req, org, type, name) {
        const end = this._histogram.timer();

        try {
            validators.name(name);
            validators.type(type);
            validators.org(org);
        } catch (error) {
            this._log.debug(
                `pkg:latest - Validation failed - ${error.message}`,
            );
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        const path = createFilePathToVersion({ org, type, name });

        try {
            const file = await this._sink.read(path);
            const outgoing = new HttpOutgoing();
            outgoing.mimeType = 'application/json';

            if (this._config.etag) {
                outgoing.etag = file.etag;
            }

            if (
                this._config.etag &&
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
