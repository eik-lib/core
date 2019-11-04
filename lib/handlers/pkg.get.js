'use strict';

const { validators } = require('@asset-pipe/common');
const HttpError = require('http-errors');
const abslog = require('abslog');
const HttpOutgoing = require('../classes/http-outgoing');
const Asset = require('../classes/asset');

class PkgGet {
    constructor(sink, config = {}, logger) {
        this._config = config;
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
            throw new HttpError.NotFound();
        }

        const asset = new Asset({
            version,
            extra,
            name,
            org,
        });

        try {
            const outgoing = new HttpOutgoing();
            outgoing.mimeType = asset.mimeType;

            const stream = await this._sink.read(asset.path);
            outgoing.stream = stream;

            return outgoing;
        } catch (error) {
            throw new HttpError.NotFound();
        }
    }
}
module.exports = PkgGet;
