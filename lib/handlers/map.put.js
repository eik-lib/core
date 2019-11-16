'use strict';

const { validators } = require('@eik/common');
const HttpError = require('http-errors');
const Busboy = require('busboy');
const abslog = require('abslog');

const { createFilePathToImportMap } = require('../utils/path-builders-fs');
const { createURIPathToImportMap } = require('../utils/path-builders-uri');
const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const utils = require('../utils/utils');
const conf = require('../utils/defaults');

const MapPut = class MapPut {
    constructor(sink, config = {}, logger) {
        this._config = { ...conf, ...config};
        this._sink = sink;
        this._log = abslog(logger);
    }

    _parser(incoming) {
        return new Promise((resolve, reject) => {
            const pathname = createURIPathToImportMap(incoming);
            const path = createFilePathToImportMap(incoming);

            const busboy = new Busboy({
                headers: incoming.headers,
                limits: {
                    fields: 0,
                    files: 1,
                    fileSize: this._config.mapMaxFileSize,
                },
            });

            busboy.on('file', async (fieldname, file) => {
                // We accept only one file on this given fieldname.
                // Throw if any other files is posted.
                if (fieldname !== 'map') {
                    this._log.info(`map:put - Import map submitted on wrong field name - Field: ${fieldname}`);
                    busboy.destroy(new HttpError.BadRequest());
                    return;
                }

                // Buffer up the incoming file and check if we can
                // parse it as JSON or not.
                let obj = {};
                try {
                    const str = await utils.streamCollector(file);
                    obj = JSON.parse(str);
                } catch (error) {
                    this._log.error(`map:put - Import map can not be parsed`);
                    this._log.trace(error);
                    busboy.destroy(new HttpError.UnsupportedMediaType());
                    return;
                }

                // Write file to storage.
                try {
                    this._log.info(`map:put - Start writing import map to sink - Pathname: ${path}`);
                    await utils.writeJSON(this._sink, path, obj, 'application/json');
                } catch (error) {
                    this._log.error(`map:put - Failed writing import map to sink - Pathname: ${path}`);
                    this._log.trace(error);
                    busboy.destroy(new HttpError.BadGateway());
                    return;
                }
                this._log.info(`map:put - Successfully wrote import map to sink - Pathname: ${path}`);
            });

            busboy.on('finish', () => {
                const outgoing = new HttpOutgoing();
                outgoing.mimeType = 'text/plain';
                outgoing.statusCode = 303;
                outgoing.location = pathname;
                resolve(outgoing);
            });

            busboy.on('error', error => {
                reject(error);
            });

            // If incoming.request is handeled by stream.pipeline, it will
            // close to early for the http framework to handle it. Let the
            // http framework handle closing incoming.request
            incoming.request.pipe(busboy);
        });
    }

    async _exist (incoming) {
        try {
            const path = createFilePathToImportMap(incoming);
            await this._sink.exist(path);
            return true;
        } catch (error) {
            return false;
        }
    }

    async handler (req, org, name, version) {
        try {
            validators.version(version);
            validators.name(name);
            validators.org(org);
        } catch (error) {
            this._log.info(`map:put - Validation failed - ${error.message}`);
            throw new HttpError.BadRequest();
        }

        const incoming = new HttpIncoming(req, {
            version,
            name,
            org,
        });

        const exist = await this._exist(incoming);
        if (exist) {
            this._log.info(`map:put - Import map exists - Org: ${org} - Name: ${name} - Version: ${version}`);
            throw new HttpError.Conflict();
        }

        const outgoing = await this._parser(incoming);
        return outgoing;
    }
}
module.exports = MapPut;
