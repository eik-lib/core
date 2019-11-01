'use strict';

const { validators } = require('@asset-pipe/common');
const { pipeline } = require('stream');
const HttpError = require('http-errors');
const Busboy = require('busboy');
const tar = require('tar');

const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const UploadLog = require('../classes/upload-log');
const Asset = require('../classes/asset');
const Meta = require('../classes/meta');
const utils = require('../utils/utils');

const parser = (sink, incoming) => {
    return new Promise((resolve, reject) => {
        const resolver = [];

        const busboy = new Busboy({
            headers: incoming.headers,
            limits: {
                fields: 4,
                files: 1,
                fileSize: 100000000,
                // fileSize: 100000
                // fileSize: 1000
            },
        });

        busboy.on('field', (name, value) => {
            const promise = Promise.resolve(new Meta({ name, value }));
            resolver.push(promise);
        });

        busboy.on('file', (fieldname, file) => {
            // We accept only one file on this given fieldname.
            // Throw if any other files is posted.
            if (fieldname !== 'filedata') {
                busboy.destroy(new HttpError(400, 'Bad request'));
                return;
            }

            const extract = new tar.Parse({
                onentry: (entry) => {
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

                    // eslint-disable-next-line no-async-promise-executor
                    const promise = new Promise(async (res, rej) => {
                        const writer = await sink.write(asset.path, asset.mimeType);
                        pipeline(entry, writer, error => {
                            if (error) {
                                rej(error);
                                return;
                            }
                            res(asset);
                        });
                    });

                    resolver.push(promise);
                },
            });

            pipeline(file, extract, error => {
                if (error) {
                    busboy.destroy(new HttpError(415, 'Unsupported media type'));
                    return;
                }
                busboy.emit('completed');
            });
        });

        busboy.on('error', error => {
            reject(error);
        });

        busboy.once('completed', () => {
            Promise.all(resolver).then(assets => {
                const log = new UploadLog(incoming);
                assets.forEach(obj => {
                    if (obj instanceof Asset) {
                        log.setAsset(obj);
                    }
                    if (obj instanceof Meta) {
                        log.setMeta(obj);
                    }
                })
                return log;
            }).then(async (log) => {
                await utils.writeJSON(
                    sink,
                    log.path,
                    log,
                    'application/json',
                );
                return log;
            }).then((log) => {
                const outgoing = new HttpOutgoing();
                outgoing.mimeType = 'application/json';
                outgoing.statusCode = 200;
                outgoing.body = log;
                resolve(outgoing);
            }).catch(err => {
                reject(err);
            });
        });

        // If incoming.request is handeled by pipeline, it will close
        // to early for the http framework to handle it. Let the
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
