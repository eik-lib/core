'use strict';

const { validators } = require('@eik/common');
const HttpError = require('http-errors');
const abslog = require('abslog');
const Metrics = require('@metrics/client');

const { createFilePathToAsset } = require('../utils/path-builders-fs');
const HttpOutgoing = require('../classes/http-outgoing');
const Asset = require('../classes/asset');
const conf = require('../utils/defaults');

const PkgGet = class PkgGet {
    constructor(sink, config = {}, logger) {
        this._config = { ...conf, ...config };
        this._sink = sink;
        this._log = abslog(logger);
        this._metrics = new Metrics();
        this._histogram = this._metrics.histogram({
            name: 'eik_core_pkg_get_handler',
            description:
                'Histogram measuring time taken in @eik/core PkgGet handler method',
            labels: {
                success: true,
            },
        });
    }

    get metrics() {
        return this._metrics;
    }

    async handler(req, org, name, version, extra) {
        const end = this._histogram.timer();

        try {
            validators.version(version);
            validators.extra(extra);
            validators.name(name);
            validators.org(org);
        } catch (error) {
            this._log.debug(`pkg:get - Validation failed - ${error.message}`);
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        const asset = new Asset({
            pathname: extra,
            version,
            name,
            org,
        });

        const path = createFilePathToAsset(asset);

        try {
            const file = await this._sink.read(path);
            const outgoing = new HttpOutgoing();
            outgoing.mimeType = asset.mimeType;

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

            this._log.debug(`pkg:get - Asset found - Pathname: ${path}`);

            end({ labels: { status: outgoing.statusCode } });

            return outgoing;
        } catch (error) {
            this._log.debug(`pkg:get - Asset not found - Pathname: ${path}`);
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }
    }
};
module.exports = PkgGet;
