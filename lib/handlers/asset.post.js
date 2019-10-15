'use strict';

const { pipeline, Duplex } = require('stream');
const Busboy = require('busboy');
const tar = require('tar');
const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const UploadLog = require('../classes/upload-log');
const Asset = require('../classes/asset');

const Parser = class Parser extends Duplex {
    constructor(incoming, sink) {
        super();

        // Parser for incomming file(s)
        this.parser = new Busboy({
            headers: incoming.headers,
            limits: {
                fileSize: 100000000
            }
        });

        this.uploadLog = new UploadLog(incoming);

        this.parser.on('field', (name, value, fieldnameTruncated, valTruncated, encoding, mimetype) => {
            this.uploadLog.setField(name, value);
        });

        this.parser.on('file', (fieldname, file, filename, encoding, mimetype) => {
            const extract = new tar.Parse({
                onentry: async (entry) => {
                    const asset = new Asset({
                        version: incoming.version,
                        extra: entry.path,
                        name: incoming.name,
                        type: incoming.type,
                        org: incoming.org,
                    });
                    // file.type = entry.type;
                    asset.size = entry.size;

                    this.uploadLog.setAsset(asset);
                    this.push(Buffer.from(`${JSON.stringify(asset)}\n`));

                    if (!asset.supported) {
                        // Entries not supported must be thrown
                        // away for extraction to continue
                        entry.resume();
                        return;
                    }

                    const writer = await sink.write(asset.path, asset.type);

                    pipeline(entry, writer, error => {
                        if (error) {
                            console.log(error)
                            asset.errored = true;
                        };
                    });
                },
            });

            pipeline(file, extract, error => {
                if (error) {
                    // TODO: Handle error
                }
                this.emit('done');
            });
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
        this.once('done', () => {
            // console.log(JSON.stringify(this.uploadLog, null, 2));
            this.push(null);
            cb();
        });
    }
}

const params = {
    type: 'object',
    properties: {
        alias: {
          type: 'string',
          minLength: 1,
          maxLength: 64,
          pattern: "^[a-zA-Z0-9_-]*$"
        },
        type: { type: 'string' },
        name: { type: 'string' },
        org: { type: 'string' },
    }
};
module.exports.params = params;

const handler = (sink, req, org, type, name, version) => {
    if (typeof org !== 'string' || org === '') {
        throw new TypeError(
            ':org is a required url parameter and must be a string'
        );
    }

    if (typeof type !== 'string' || type === '') {
        throw new TypeError(
            ':type is a required url parameter and must be a string'
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

    return new Promise((resolve, reject) => {
        const incoming = new HttpIncoming(req, {
            version,
            name,
            type,
            org,
        });
        const parser = new Parser(incoming, sink);
        const outgoing = new HttpOutgoing();

        outgoing.mimeType = 'application/octet-stream';

        incoming.request.pipe(parser).pipe(outgoing);
        resolve(outgoing);
    });
};
module.exports.handler = handler;
