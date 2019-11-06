'use strict';

const { validators } = require('@asset-pipe/common');
const HttpError = require('http-errors');
const abslog = require('abslog');
const HttpOutgoing = require('../classes/http-outgoing');
const paths = require('../utils/paths');

class PkgLog {
    constructor(sink, config = {}, logger) {
        this._config = config;
        this._sink = sink;
        this._log = abslog(logger);
    }

    async handler (req, org, name, version) {
        try {
            validators.version(version);
            validators.name(name);
            validators.org(org);
        } catch (error) {
            throw new HttpError.NotFound();
        }

        const path = paths.pkgLog({ org, name, version });

        try {
            const outgoing = new HttpOutgoing();
            outgoing.mimeType = 'application/json';

            const stream = await this._sink.read(path);
            outgoing.stream = stream;

            return outgoing;
        } catch (error) {
            throw new HttpError.NotFound();
        }
    }
}
module.exports = PkgLog;