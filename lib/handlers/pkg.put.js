'use strict';

const { validators } = require('@asset-pipe/common');
const { pipeline } = require('stream');
const abslog = require('abslog');
const HttpError = require('http-errors');
const Busboy = require('busboy');
const tar = require('tar');

const { createFilePathToPackage, createFilePathToAsset } = require('../utils/path-builders-fs');
const { createURIPathToPkgLog } = require('../utils/path-builders-uri');
const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const Package = require('../classes/package');
const Asset = require('../classes/asset');
const utils = require('../utils/utils');
const Meta = require('../classes/meta');
const conf = require('../utils/defaults');

const PkgPut = class PkgPut {
    constructor(sink, config = {}, logger) {
        this._config = { ...conf, ...config};
        this._sink = sink;
        this._log = abslog(logger);
    }

    _parser(incoming) {
        return new Promise((resolve, reject) => {
            const resolver = [];

            const busboy = new Busboy({
                headers: incoming.headers,
                limits: {
                    fields: 0,
                    files: 1,
                    fileSize: this._config.pkgMaxFileSize,
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
                    busboy.destroy(new HttpError.BadRequest());
                    return;
                }

                const extract = new tar.Parse({
                    onentry: (entry) => {
                        const asset = new Asset({
                            pathname: entry.path,
                            version: incoming.version,
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
                            const path = createFilePathToAsset(asset);
                            const writer = await this._sink.write(path, asset.mimeType);
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
                        busboy.destroy(new HttpError.UnsupportedMediaType());
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
                    const pkg = new Package(incoming);
                    assets.forEach(obj => {
                        if (obj instanceof Asset) {
                            pkg.setAsset(obj);
                        }
                        if (obj instanceof Meta) {
                            pkg.setMeta(obj);
                        }
                    })
                    return pkg;
                }).then(async (pkg) => {
                    const path = createFilePathToPackage(pkg);
                    await utils.writeJSON(
                        this._sink,
                        path,
                        pkg,
                        'application/json',
                    );
                    return pkg;
                }).then((pkg) => {
                    const pathname = createURIPathToPkgLog(pkg);

                    const outgoing = new HttpOutgoing();
                    outgoing.mimeType = 'text/plain';
                    outgoing.statusCode = 303;
                    outgoing.location = pathname;

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
    }

    async _exist (incoming) {
        try {
            const path = createFilePathToPackage(incoming);
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

        const incoming = new HttpIncoming(req, {
            version,
            name,
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
module.exports = PkgPut;
