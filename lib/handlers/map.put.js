'use strict';

const HttpError = require('http-errors');
const Busboy = require('busboy');
const { validators } = require('@asset-pipe/common');
const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const ImportMap = require('../classes/import-map');
const utils = require('../utils/utils');

const parser = (sink, incoming) => {
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
                busboy.destroy(new HttpError(400, 'Bad request'));
                return;
            }

            // Buffer up the incoming file and check if we can
            // parse it as JSON or not.
            let obj = {};
            try {
                const str = await utils.streamCollector(file);
                obj = JSON.parse(str);
            } catch (error) {
                busboy.destroy(new HttpError(415, 'Unsupported media type'));
                return;
            }

            // Write file to storage.
            try {
                await utils.writeJSON(sink, path, obj, 'application/json');
            } catch (error) {
                busboy.destroy(new HttpError(502, 'Bad gateway'));
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
};

const handler = async (sink, req, org, name, version) => {
    try {
        validators.version(version);
        validators.name(name);
        validators.org(org);
    } catch (error) {
        throw new HttpError(400, 'Bad request');
    }

    const incoming = new HttpIncoming(req, {
        version,
        name,
        org,
    });

    const outgoing = await parser(sink, incoming);
    return outgoing;
};
module.exports.handler = handler;
