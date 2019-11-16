'use strict';

const { validators } = require('@eik/common');
const HttpError = require('http-errors');
const abslog = require('abslog');

const { createFilePathToImportMap } = require('../utils/path-builders-fs');
const HttpOutgoing = require('../classes/http-outgoing');
const conf = require('../utils/defaults');

const MapGet = class MapGet {
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
            this._log.debug(`map:get - Validation failed - ${error.message}`);
            throw new HttpError.NotFound();
        }

        const path = createFilePathToImportMap({ org, name, version });

        try {
            const outgoing = new HttpOutgoing();
            outgoing.mimeType = 'application/json';

            const stream = await this._sink.read(path);
            outgoing.stream = stream;

            this._log.debug(`map:get - Import map found - Pathname: ${path}`);

            return outgoing;
        } catch (error) {
            this._log.debug(`map:get - Import map not found - Pathname: ${path}`);
            throw new HttpError.NotFound();
        }
    }
}
module.exports = MapGet;
