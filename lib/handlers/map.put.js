'use strict';

const { validators } = require('@asset-pipe/common');
const HttpError = require('http-errors');
const Busboy = require('busboy');
const abslog = require('abslog');
const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const ImportMap = require('../classes/import-map');
const utils = require('../utils/utils');

class MapPut {
    constructor(sink, config = {}, logger) {
        this._config = config;
        this._sink = sink;
        this._log = abslog(logger);
    }

    _parser(incoming) {
        return new Promise((resolve, reject) => {
            const pathname = ImportMap.buildPathname(
                incoming.org,
                incoming.name,
                incoming.version,
            );

            const path = ImportMap.buildPath(
                incoming.org,
                incoming.name,
                incoming.version,
            );

            const busboy = new Busboy({
                headers: incoming.headers,
                limits: {
                    fields: 0,
                    files: 1,
                    fileSize: 1000000,
                },
            });

            busboy.on('file', async (fieldname, file) => {
                // We accept only one file on this given fieldname.
                // Throw if any other files is posted.
                if (fieldname !== 'map') {
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
                    busboy.destroy(new HttpError.UnsupportedMediaType());
                    return;
                }

                // Write file to storage.
                try {
                    await utils.writeJSON(this._sink, path, obj, 'application/json');
                } catch (error) {
                    busboy.destroy(new HttpError.BadGateway());
                }
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

    async _exist (org, name, version) {
        try {
            const path = ImportMap.buildPath(org, name, version);
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
            throw new HttpError.BadRequest();
        }

        const exist = await this._exist(org, name, version);
        if (exist) {
            throw new HttpError.Conflict();
        }

        const incoming = new HttpIncoming(req, {
            version,
            name,
            org,
        });

        const outgoing = await this._parser(incoming);
        return outgoing;
    }
}
module.exports = MapPut;
