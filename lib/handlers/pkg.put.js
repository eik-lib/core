'use strict';

const { pipeline, Duplex } = require('stream');
const Busboy = require('busboy');
const tar = require('tar');
const HttpError = require('http-errors');
const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const UploadLog = require('../classes/upload-log');
const Asset = require('../classes/asset');
const validators = require('../utils/validators');
const utils = require('../utils/utils');

// initializing :  0 : From when a request comes in until we start writing the first extracted file from the .tar to the sink.
//                     Any errors in this state shold be treated as request errors and yeld some http status error code.
// processing   :  1 : From when a "initializing" state is passed and while files are being written to the sink until all files if written.
//                     Any errors in this state should yeld an attempt to clean up before terminating the stream. Its to late to send a http status error at this point.
// finalizing   :  2 : From when all files is written to the sink and until the upload log is written to the sink.
//                     Any errors in this state should yeld an attempt to clean up before terminating the stream. Its to late to send a http status error at this point.
// success      :  3 : When all files and upload log is successfully written to the sink.

const STATE_INITIALIZING = 0;
const STATE_PROCESSING = 1;
const STATE_FINALIZING = 2;
const STATE_SUCCESS = 3;

const Parser = class Parser extends Duplex {
    constructor(incoming, sink) {
        super();
        this._state = STATE_INITIALIZING;
        this._parser = new Busboy({
            headers: incoming.headers,
            limits: {
                fields: 4,
                files: 1,
                fileSize: 100000000,
                // fileSize: 100000
                // fileSize: 1000
            },
        });

        this._log = new UploadLog(incoming);

        this._parser.on('field', (name, value) => {
            this._log.setField(name, value);
        });

        this._parser.on('file', (
            fieldname,
            file, // filename, encoding, mimetype,
        ) => {
            // We accept only one file on this given fieldname. Throw if any other files is posted.
            if (fieldname !== 'filedata') {
                this.destroy(new HttpError(400, 'Bad request'));
                return;
            }

            const extract = new tar.Parse({
                onentry: async entry => {
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
                            // Writing the file to the sink failed, terminate the stream
                            this.destroy(error);
                            return;
                        }
                        this._log.setAsset(asset);
                        this.push(Buffer.from(`${JSON.stringify(asset)}\n`));
                    });
                },
            });

            pipeline(file, extract, async error => {
                if (error) {
                    this.destroy(new HttpError(415, 'Unsupported media type'));
                    return;
                }

                // Uploaded file was never extracted, but tar module did not error.
                // Iow; we did not get a tar file. Trigger error.
                if (this._state === STATE_INITIALIZING) {
                    this.destroy(new HttpError(415, 'Unsupported media type'));
                    return;
                }

                this._state = STATE_FINALIZING;
                this.emit('state', this._state);

                try {
                    await utils.writeJSON(
                        sink,
                        this._log.path,
                        this._log,
                        'application/json',
                    );
                    this._state = STATE_SUCCESS;
                    this.emit('state', this._state);
                } catch (err) {
                    this.destroy(err);
                }
            });
        });
    }

    _read() {
        // Push to readable happens in constructor
    }

    _write(chunk, enc, cb) {
        this._parser.write(chunk);
        cb();
    }

    _final(cb) {
        // Upload was successfull. Close the stream so the http response can is closed.
        if (this._state >= STATE_SUCCESS) {
            this.push(null);
            cb();
            return;
        }

        this.on('state', state => {
            if (state >= STATE_SUCCESS) {
                this.push(null);
                cb();
            }
        });
    }
};

const init = (sink, incoming) => {
    return new Promise((resolve, reject) => {
        const parser = new Parser(incoming, sink);

        const outgoing = new HttpOutgoing();
        outgoing.mimeType = 'application/octet-stream';

        parser.on('state', (/* state */) => {
            if (parser._state === STATE_PROCESSING) {
                resolve(outgoing);
            }
        });

        // If incoming.request is handeled by pipeline, it will close
        // to early for the http framework to handle it. Let the
        // http framework handle closing incoming.request
        incoming.request.pipe(parser);

        pipeline(parser, outgoing, error => {
            if (error && parser._state === STATE_INITIALIZING) {
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
