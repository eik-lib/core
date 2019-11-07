'use strict';

const { validators } = require('@asset-pipe/common');
const HttpError = require('http-errors');
const Busboy = require('busboy');
const abslog = require('abslog');

const { createFilePathToAlias } = require('../utils/path-builders-fs');
const { createURIToAlias } = require('../utils/path-builders-uri');
const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const Alias = require('../classes/alias');
const utils = require('../utils/utils');

class AliasPut {
    constructor(sink, config = {}, logger) {
        this._config = config;
        this._sink = sink;
        this._log = abslog(logger);
    }

    _parser(incoming) {
        return new Promise((resolve, reject) => {
            const pathname = createURIToAlias(incoming);
            const path = createFilePathToAlias(incoming);

            const alias = new Alias(incoming);

            const busboy = new Busboy({
                headers: incoming.headers,
                limits: {
                    fields: 1,
                    files: 0,
                    fileSize: 0,
                },
            });

            busboy.on('field', (name, value) => {
                if (name === 'version') {
                    try {
                        validators.version(value);
                    } catch (error) {
                        busboy.destroy(new HttpError.BadRequest());
                        return;
                    }
                    alias.version = value;
                }
            });

            busboy.on('finish', async () => {
                try {
                    await utils.writeJSON(
                        this._sink,
                        path,
                        // alias.path,
                        alias,
                        'application/json',
                    );
                } catch (error) {
                    // TODO: Will this trigger error or is it too late to do this in the finish event??????????
                    busboy.destroy(new HttpError.BadGateway());
                    return;
                }

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
            const path = createFilePathToAlias(incoming);
            await this._sink.exist(path);
            return true;
        } catch (error) {
            return false;
        }
    }

    async handler (req, org, type, name, alias) {
        try {
            validators.alias(alias);
            validators.name(name);
            validators.type(type);
            validators.org(org);
        } catch (error) {
            throw new HttpError.BadRequest();
        }

        const incoming = new HttpIncoming(req, {
            alias,
            name,
            type,
            org,
        });

        const exist = await this._exist(incoming);
        if (exist) {
            throw new HttpError.Conflict();
        }

        const outgoing = await this._parser(incoming);
        return outgoing;
    }
}
module.exports = AliasPut;
