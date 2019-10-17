'use strict';

const { pipeline, Duplex } = require('stream');
const Busboy = require('busboy');
const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const ImportMap = require('../classes/import-map');

const Parser = class Parser extends Duplex {
    constructor(incoming, sink) {
        super();

        this._done = false;

        this.sink = sink;

        this.parser = new Busboy({
            headers: incoming.headers,
            limits: {
                fileSize: 100000
            }
        });

        this.parser.on('field', (name, value) => {

        });

        this.parser.on('file', async (fieldname, file, filename, encoding, mimetype) => {
            if (fieldname === 'map') {

                if (mimetype !== 'application/json') {
                    // TODO: Handle error
                }

                const path = ImportMap.buildPath(incoming.org, incoming.name, incoming.version);
                const writer = await this.sink.write(path, mimetype);

                pipeline(file, writer, error => {
                    if (error) {
                        // TODO: Handle error
                    }
                    this._done = true;
                    this.emit('done');
                });
            }
        });

        this.parser.on('partsLimit', () => {
            const error = new Error('Payload Too Large')
            this.destroy(error);
        });

        this.parser.on('filesLimit', () => {
            const error = new Error('Payload Too Large')
            this.destroy(error);
        });

        this.parser.on('fieldsLimit', () => {
            const error = new Error('Payload Too Large')
            this.destroy(error);
        });
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
        } else {
            this.once('done', () => {
                this.push(null);
                cb();
            });
        }
    }
}

const handler = async (sink, req, org, name, version) => {
    if (typeof org !== 'string' || org === '') {
        throw new TypeError(
            ':org is a required url parameter and must be a string'
        );
    }

    if (typeof name !== 'string' || name === '') {
        throw new TypeError(
            ':name is a required url parameter and must be a string'
        );
    }

    if (typeof version !== 'string' || version === '') {
        throw new TypeError(
            ':version is a required url parameter and must be a string'
        );
    }

    const incoming = new HttpIncoming(req, {
        version,
        name,
        org,
    });

    const outgoing = new HttpOutgoing();
    const parser = new Parser(incoming, sink);

    outgoing.mimeType = 'application/octet-stream';

    incoming.request.pipe(parser).pipe(outgoing);
    return outgoing;
};
module.exports.handler = handler;
