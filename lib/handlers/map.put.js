'use strict';

const { pipeline, Duplex } = require('stream');
const HttpError = require('http-errors');
const Busboy = require('busboy');
const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const ImportMap = require('../classes/import-map');
const validators = require('../utils/validators');

const Parser = class Parser extends Duplex {
    constructor(incoming, sink) {
        super();

        this._done = false;

        this.parser = new Busboy({
            headers: incoming.headers,
            limits: {
                fields: 4,
                files: 1,
                fileSize: 100000,
            },
        });

        // eslint-disable-next-line no-unused-vars
        this.parser.on('field', (name, value) => {});

        this.parser.on(
            'file',
            async (fieldname, file, filename, encoding, mimetype) => {
                // We accept only one file on this given fieldname.
                // Throw if any other files is posted.
                if (fieldname !== 'map') {
                    this.destroy(new HttpError(400, 'Bad request'));
                    return;
                }

                /* TODO: find better way to validate if its a proper import map...
                if (mimetype !== 'application/json') {
                    this.destroy(new HttpError(415, 'Unsupported media type'));
                    return;
                }
                */

                const path = ImportMap.buildPath(
                    incoming.org,
                    incoming.name,
                    incoming.version,
                );

                const writer = await sink.write(path, mimetype);
                pipeline(file, writer, error => {
                    if (error) {
                        // Writing the file to the sink failed, terminate the stream
                        this.destroy(error);
                        return;
                    }
                    this._done = true;
                    this.emit('done');
                });
            },
        );
    }

    _read() {
        // Push to readable happens in constructor
    }

    _write(chunk, enc, cb) {
        this.parser.write(chunk);
        cb();
    }

    _final(cb) {
        if (this._done) {
            this.push(null);
            cb();
            return;
        }

        this.once('done', () => {
            this.push(null);
            cb();
        });
    }
};

const init = (sink, incoming) => {
    return new Promise((resolve, reject) => {
        const parser = new Parser(incoming, sink);

        const outgoing = new HttpOutgoing();
        outgoing.mimeType = 'application/octet-stream';

        parser.on('done', (/* state */) => {
            resolve(outgoing);
        });

        // If incoming.request is handeled by pipeline, it will close
        // to early for the http framework to handle it. Let the
        // http framework handle closing incoming.request
        incoming.request.pipe(parser);

        pipeline(parser, outgoing, error => {
            if (error) {
                reject(error);
            }
        });
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

    const stream = await init(sink, incoming);
    return stream;
};
module.exports.handler = handler;
