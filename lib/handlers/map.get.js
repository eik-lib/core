'use strict';

const { validators } = require('@eik/common');
const originalUrl = require('original-url');
const HttpError = require('http-errors');
const abslog = require('abslog');
const Metrics = require('@metrics/client');

const { createFilePathToImportMap } = require('../utils/path-builders-fs');
const HttpOutgoing = require('../classes/http-outgoing');
const conf = require('../utils/defaults');

const MapGet = class MapGet {
    constructor(sink, config = {}, logger) {
        this._config = { ...conf, ...config };
        this._sink = sink;
        this._log = abslog(logger);
        this._metrics = new Metrics();
        this._histogram = this._metrics.histogram({
            name: 'eik_core_map_get_handler',
            description:
                'Histogram measuring time taken in @eik/core MapGet handler method',
            labels: {
                success: true,
            },
        });


        const orgConf = [
            ['localhost', 'local'],
            ['127.0.0.1', 'local'],
        ];

        this._orgRegistry = new Map(orgConf);
    }

    get metrics() {
        return this._metrics;
    }

    async handler(req, name, version) {
        const end = this._histogram.timer();



        const url = originalUrl(req);
        const org = this._orgRegistry.get(url.hostname);

        if (!org) {
            this._log.info(`pkg:put - Hostname does not match a configured organization - ${url.hostname}`);
            const e = new HttpError.BadRequest();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }



        try {
            validators.version(version);
            validators.name(name);
            // validators.org(org);
        } catch (error) {
            this._log.debug(`map:get - Validation failed - ${error.message}`);
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        const path = createFilePathToImportMap({ org, name, version });

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

            this._log.debug(`map:get - Import map found - Pathname: ${path}`);

            end({ labels: { status: outgoing.statusCode } });

            return outgoing;
        } catch (error) {
            this._log.debug(
                `map:get - Import map not found - Pathname: ${path}`,
            );
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }
    }
};
module.exports = MapGet;
