'use strict';

const { validators } = require('@eik/common');
const HttpError = require('http-errors');
const abslog = require('abslog');

const { createFilePathToPackage } = require('../utils/path-builders-fs');
const HttpOutgoing = require('../classes/http-outgoing');
const conf = require('../utils/defaults');

const PkgLog = class PkgLog {
    constructor(sink, config = {}, logger) {
        this._config = { ...conf, ...config};
        this._sink = sink;
        this._log = abslog(logger);
    }

    async handler (req, org, name, version) {
        try {
            validators.version(version);
            validators.name(name);
            validators.org(org);
        } catch (error) {
            this._log.debug(`pkg:log - Validation failed - ${error.message}`);
            throw new HttpError.NotFound();
        }

        const path = createFilePathToPackage({ org, name, version });

        try {
            const file = await this._sink.read(path);
            const outgoing = new HttpOutgoing();
            outgoing.mimeType = 'application/json';

            if (this._config.etag) {
                outgoing.etag = file.etag;
            }

            if (this._config.etag && req.headers['if-none-match'] === file.etag) {
                outgoing.statusCode = 304;
                file.stream.destroy();
            } else {
                outgoing.statusCode = 200;
                outgoing.stream = file.stream;
            }

            this._log.debug(`pkg:log - Package log found - Pathname: ${path}`);

            return outgoing;
        } catch (error) {
            this._log.debug(`pkg:log - Package log found - Pathname: ${path}`);
            throw new HttpError.NotFound();
        }
    }
}
module.exports = PkgLog;
