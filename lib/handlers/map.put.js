'use strict';

const { validators } = require('@eik/common');
const HttpError = require('http-errors');
const Busboy = require('busboy');
const crypto = require('crypto');
const abslog = require('abslog');

const { createFilePathToImportMap, createFilePathToVersion } = require('../utils/path-builders-fs');
const { createURIPathToImportMap } = require('../utils/path-builders-uri');
const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const Versions = require('../classes/versions');
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

                const hasher = crypto.createHash('sha512');

                // Buffer up the incoming file and check if we can
                // parse it as JSON or not.
                let obj = {};
                try {
                    const str = await utils.streamCollector(file);
                    hasher.update(str);
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

                const integrity = `sha512-${hasher.digest('base64')}`;

                busboy.emit('completed', integrity);
            });

            busboy.on('error', error => {
                reject(error);
            });

            busboy.once('completed', (integrity) => {
                resolve(integrity);
            });

            // If incoming.request is handeled by stream.pipeline, it will
            // close to early for the http framework to handle it. Let the
            // http framework handle closing incoming.request
            incoming.request.pipe(busboy);
        });
    }

    async _readVersions (incoming) {
        const path = createFilePathToVersion(incoming);
        let versions;
        try {
            const obj = await utils.readJSON(this._sink, path);
            versions = new Versions(obj);
            this._log.info(`map:put - Successfully read version meta file from sink - Pathname: ${path}`);
        } catch (error) {
            // File does not exist, its probably a new package
            versions = new Versions(incoming);
            this._log.info(`map:put - Version meta file did not exist in sink - Create new - Pathname: ${path}`);
        }
        return versions;
    }

    async _writeVersions (incoming, versions) {
        const path = createFilePathToVersion(incoming);
        await utils.writeJSON(
            this._sink,
            path,
            versions,
            'application/json'
        );
        this._log.info(`map:put - Successfully wrote version meta file to sink - Pathname: ${path}`);
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
            type: 'map',
            version,
            name,
            org,
        });

        const versions = await this._readVersions(incoming);

        if (!versions.check(version)) {
            this._log.info(`map:put - Semver version is lower than previous version of the package - Org: ${org} - Name: ${name} - Version: ${version}`);
            throw new HttpError.Conflict();
        }

        const integrity = await this._parser(incoming);

        versions.setVersion(version, integrity);

        try {
            await this._writeVersions(incoming, versions);
        } catch(error) {
            throw new HttpError.BadGateway();
        }

        const outgoing = new HttpOutgoing();
        outgoing.mimeType = 'text/plain';
        outgoing.statusCode = 303;
        outgoing.location = createURIPathToImportMap(incoming);

        return outgoing;
    }
}
module.exports = MapPut;
