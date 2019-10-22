'use strict';

const { pipeline, Duplex } = require('stream');
const Busboy = require('busboy');
const tar = require('tar');
const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const UploadLog = require('../classes/upload-log');
const Asset = require('../classes/asset');
const validators = require('../utils/validators');
const httpError = require('http-errors');

// initializing :  0 : From when a request comes in until we start writing the first extracted file from the .tar to the sink.
//                     Any errors in this state shold be treated as request errors and yeld some http status error code.
// processing   :  1 : From when a "initializing" state is passed and while files are being written to the sink until all files if written.
//                     Any errors in this state should yeld an attempt to clean up before terminating the stream. Its to late to send a http status error at this point.
// finalizing   :  2 : From when all files is written to the sink and until the upload log is written to the sink.
//                     Any errors in this state should yeld an attempt to clean up before terminating the stream. Its to late to send a http status error at this point.
// success      :  3 : When all files and upload log is successfully written to the sink.
// errored      :  4 : When something errored.

const STATE_INITIALIZING = 0;
const STATE_PROCESSING   = 1;
const STATE_FINALIZING   = 2;
const STATE_SUCCESS      = 3;
const STATE_ERRORED      = 4;

const Parser = class Parser extends Duplex {
    constructor(incoming, sink) {
        super();
        this._state = STATE_INITIALIZING;

        // Parser for incomming file(s)
        this.parser = new Busboy({
            headers: incoming.headers,
            limits: {
                fileSize: 100000000
            }
        });

        this.uploadLog = new UploadLog(incoming);

        this.parser.on('field', (name, value, ) => {
            this.uploadLog.setField(name, value);
        });

        this.parser.on('file', (fieldname, file, filename, encoding, mimetype) => {

            // Ignore any other uploaded files
            if (fieldname !== 'filedata') {
                return;
            }

            const extract = new tar.Parse({
                onentry: async (entry) => {
                    const asset = new Asset({
                        version: incoming.version,
                        extra: entry.path,
                        name: incoming.name,
                        type: entry.type,
                        org: incoming.org,
                    });

                    asset.size = entry.size;

                    if (asset.type !== 'file') {
                        // Entries not supported must be thrown
                        // away for extraction to continue
                        entry.resume();
                        return;
                    }

                    // Switch state to "processing"
                    if (this._state < STATE_PROCESSING) {
                        this._state = STATE_PROCESSING;
                        this.emit('state', this._state);
                    }

                    const writer = await sink.write(asset.path, asset.mimeType);
                    pipeline(entry, writer, error => {
                        if (error) {
                            console.log('ERROR A', error);
                            return;
                        };

                        this.uploadLog.setAsset(asset);
                        this.push(Buffer.from(`${JSON.stringify(asset)}\n`));
                    });
                },
            });

            pipeline(file, extract, error => {
                if (error) {
                    this._state = STATE_ERRORED;
                    this.emit('error', error);
                    return;
                }

                // Uploaded file was never extracted, but tar module did not error.
                // Iow; we did not get a tar file. Trigger error.
                if (this._state === STATE_INITIALIZING) {
                    this._state = STATE_ERRORED;
                    this.emit('error', new Error('Uploaded file is not a tar file or is an empty tar file'));
                    return;
                }

                this._state = STATE_FINALIZING;
                this.emit('state', this._state);

                setTimeout(() => {
                    this._state = STATE_SUCCESS;
                    this.emit('state', this._state);
                }, 1000);

            });
        });

        this.parser.on('partsLimit', () => {
            const error = new Error('Payload Too Large')
            console.log(error);
            this.destroy(error);
        });

        this.parser.on('filesLimit', () => {
            const error = new Error('Payload Too Large')
            console.log(error);
            this.destroy(error);
        });

        this.parser.on('fieldsLimit', () => {
            const error = new Error('Payload Too Large')
            console.log(error);
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
        // Upload was successfull. Close the stream so the http response can is closed.
        if (this._state === STATE_SUCCESS) {
            this.push(null);
            cb();
            return;
        }

        this.on('state', (state) => {
            if (state === STATE_SUCCESS) {
                this.push(null);
                cb();
            }
        });

    }
}

const init = (sink, incoming) => {
    return new Promise((resolve, reject) => {
        const parser = new Parser(incoming, sink);

        parser.on('state', (state) => {
            if (state === STATE_PROCESSING) {
                resolve(parser);
            }
        });

        parser.on('error', (error) => {
            console.log(error)
            reject(error);
        });

        incoming.request.pipe(parser);
    });
}

const handler = async (sink, req, org, name, version) => {
    try {
        validators.version(version);
        validators.name(name);
        validators.org(org);
    } catch (error) {
        throw new httpError(400, 'Bad request');
    }

    const incoming = new HttpIncoming(req, {
        version,
        name,
        org,
    });

    try {
        const outgoing = new HttpOutgoing();
        outgoing.mimeType = 'application/octet-stream';

        const parser = await init(sink, incoming);
        parser.pipe(outgoing);

        return outgoing;
    } catch (error) {
        throw new httpError(500, 'Internal server error');
    }
};
module.exports.handler = handler;
