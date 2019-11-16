'use strict';

const { validators } = require('@eik/common');
const HttpError = require('http-errors');
const abslog = require('abslog');

const { createFilePathToAsset } = require('../utils/path-builders-fs');
const HttpOutgoing = require('../classes/http-outgoing');
const Asset = require('../classes/asset');
const conf = require('../utils/defaults');

const PkgGet = class PkgGet {
    constructor(sink, config = {}, logger) {
        this._config = { ...conf, ...config};
        this._sink = sink;
        this._log = abslog(logger);
    }

    async handler (req, org, name, version, extra) {
        try {
            validators.version(version);
            validators.extra(extra);
            validators.name(name);
            validators.org(org);
        } catch (error) {
            this._log.debug(`pkg:get - Validation failed - ${error.message}`);
            throw new HttpError.NotFound();
        }

        const asset = new Asset({
            pathname: extra,
            version,
            name,
            org,
        });

        const path = createFilePathToAsset(asset);

        try {
            const outgoing = new HttpOutgoing();
            outgoing.mimeType = asset.mimeType;

            const stream = await this._sink.read(path);
            outgoing.stream = stream;

            this._log.debug(`pkg:get - Asset found - Pathname: ${path}`);

            return outgoing;
        } catch (error) {
            this._log.debug(`pkg:get - Asset not found - Pathname: ${path}`);
            throw new HttpError.NotFound();
        }
    }
}
module.exports = PkgGet;
