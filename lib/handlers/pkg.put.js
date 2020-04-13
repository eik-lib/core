'use strict';

const { validators } = require('@eik/common');
const { pipeline } = require('stream');
const originalUrl = require('original-url');
const HttpError = require('http-errors');
const Metrics = require('@metrics/client');
const abslog = require('abslog');
const Busboy = require('busboy');
const tar = require('tar');

const {
    createFilePathToPackage,
    createFilePathToAsset,
    createFilePathToVersion,
} = require('../utils/path-builders-fs');
const { createURIPathToPkgLog } = require('../utils/path-builders-uri');
const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const Versions = require('../classes/versions');
const Package = require('../classes/package');
const Asset = require('../classes/asset');
const utils = require('../utils/utils');
const Meta = require('../classes/meta');
const Hash = require('../utils/hash');
const conf = require('../utils/defaults');

const PkgPut = class PkgPut {
    constructor(sink, config = {}, logger) {
        this._config = { ...conf, ...config };
        this._sink = sink;
        this._log = abslog(logger);
        this._metrics = new Metrics();
        this._histogram = this._metrics.histogram({
            name: 'eik_core_pkg_put_handler',
            description:
                'Histogram measuring time taken in @eik/core PkgPut handler method',
            labels: {
                success: true,
            },
        });
        this._orgRegistry = new Map(this._config.organizations);
    }

    get metrics() {
        return this._metrics;
    }

    _parser(incoming) {
        return new Promise((resolve, reject) => {
            const queue = [];

            const busboy = new Busboy({
                headers: incoming.headers,
                limits: {
                    fields: 0,
                    files: 1,
                    fileSize: this._config.pkgMaxFileSize,
                },
            });

            busboy.on('field', (name, value) => {
               queue.push(this._handleField({
                    value,
                    name,
                }));
            });

            busboy.on('file', (fieldname, file, filename) => {
                this._handleUploadedFile({
                    fieldname,
                    file,
                    filename,
                    incoming,
                }).then(files => {
                    this._log.info(`pkg:put - Successfully extracted package - Field: ${fieldname} - Filename: ${filename}`);
                    queue.push(...files);
                    busboy.emit('completed');
                }).catch(error => {
                    busboy.emit('error', error);
                });
            });

            busboy.on('error', error => {
                reject(error);
            });

            busboy.once('completed', () => {
                Promise.all(queue).then(assets => {
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
                }).then(async pkg => {
                    const path = createFilePathToPackage(pkg);
                    await utils.writeJSON(
                        this._sink,
                        path,
                        pkg,
                        'application/json',
                    );

                    this._log.info(
                        `pkg:put - Successfully wrote package meta file to sink - Pathname: ${path}`,
                    );

                    resolve(pkg);
                }).catch(error => {
                    this._log.error(
                        'pkg:put - Failed writing package meta file to sink',
                    );
                    this._log.trace(error);
                    busboy.emit('error', HttpError.BadGateway());
                });

            });

            // If incoming.request is handeled by pipeline, it will close
            // to early for the http framework to handle it. Let the
            // http framework handle closing incoming.request
            incoming.request.pipe(busboy);

        });

    }

    _handleField({ name, value }) {
        this._log.info(
            `pkg:put - Input field added - Name: ${name} - Value: ${value}`,
        );
        return Promise.resolve(new Meta({ name, value }));
    }

    _handleUploadedFile({ fieldname, file, filename, incoming }) {
        return new Promise((resolve, reject) => {
            // We accept only one file on this given fieldname.
            // Throw if any other files is posted.
            if (fieldname !== 'package') {
                this._log.info(
                    `pkg:put - Package submitted on wrong field name - Field: ${fieldname}`,
                );
                reject(new HttpError.BadRequest());
            }

            const files = [];

            this._log.info(
                `pkg:put - Start extracting package - Field: ${fieldname} - Filename: ${filename}`,
            );

            const extract = new tar.Parse({
                onentry: entry => {
                    // Entries not supported must be thrown
                    // away for extraction to continue
                    if (entry.type.toLowerCase() !== 'file') {
                        entry.resume();
                        return;
                    }
                    files.push(this._handleExtractedFile({ entry, incoming }));
                },

            });

            pipeline(file, extract, error => {
                if (error) {
                    this._log.error(
                        `pkg:put - Failed extracting package - Field: ${fieldname} - Filename: ${filename}`,
                    );
                    this._log.trace(error);
                    reject(new HttpError.UnsupportedMediaType());
                    return;
                }
                resolve(files);
            });
        });
    }

    _handleExtractedFile({ incoming, entry }) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            const asset = new Asset({
                pathname: entry.path,
                version: incoming.version,
                name: incoming.name,
                type: entry.type,
                org: incoming.org,
            });
            asset.size = entry.size;

            const path = createFilePathToAsset(asset);

            this._log.info(
                `pkg:put - Start writing asset to sink - Pathname: ${path}`,
            );

            const writer = await this._sink.write(
                path,
                asset.mimeType,
            );

            entry.on('readable', () => {
                entry.read();
            });

            const hash = new Hash();

            pipeline(entry, hash, writer, error => {
                if (error) {
                    this._log.error(
                        `pkg:put - Failed writing asset to sink - Pathname: ${path}`,
                    );
                    this._log.trace(error);
                    reject(error);
                    return;
                }

                asset.integrity = hash.hash;

                this._log.info(
                    `pkg:put - Successfully wrote asset to sink - Pathname: ${path}`,
                );
                resolve(asset);
            });
        });
    }

    async _readVersions(incoming) {
        const path = createFilePathToVersion(incoming);
        let versions;
        try {
            const obj = await utils.readJSON(this._sink, path);
            versions = new Versions(obj);
            this._log.info(
                `pkg:put - Successfully read version meta file from sink - Pathname: ${path}`,
            );
        } catch (error) {
            // File does not exist, its probably a new package
            versions = new Versions(incoming);
            this._log.info(
                `pkg:put - Version meta file did not exist in sink - Create new - Pathname: ${path}`,
            );
        }
        return versions;
    }

    async _writeVersions(incoming, versions) {
        const path = createFilePathToVersion(incoming);
        await utils.writeJSON(this._sink, path, versions, 'application/json');
        this._log.info(
            `pkg:put - Successfully wrote version meta file to sink - Pathname: ${path}`,
        );
    }

    // async handler(req, org, name, version) {
    async handler(req, name, version) {
        const end = this._histogram.timer();

        const url = originalUrl(req);
        const org = this._orgRegistry.get(url.hostname);

        if (!org) {
            this._log.info(`pkg:put - Hostname does not match a configured organization - ${url.hostname}`);
            const e = new HttpError.InternalServerError();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        try {
            validators.version(version);
            validators.name(name);
        } catch (error) {
            this._log.info(`pkg:put - Validation failed - ${error.message}`);
            const e = new HttpError.BadRequest();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        const incoming = new HttpIncoming(req, {
            type: 'pkg',
            version,
            name,
            org,
        });

        const versions = await this._readVersions(incoming);

        if (!versions.check(version)) {
            this._log.info(
                `pkg:put - Semver version is lower than previous version of the package - Org: ${org} - Name: ${name} - Version: ${version}`,
            );
            const e = new HttpError.Conflict();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        const pkg = await this._parser(incoming);
        versions.setVersion(version, pkg.integrity);

        try {
            await this._writeVersions(incoming, versions);
        } catch (error) {
            const e = new HttpError.BadGateway();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        const outgoing = new HttpOutgoing();
        outgoing.mimeType = 'text/plain';
        outgoing.statusCode = 303;
        outgoing.location = createURIPathToPkgLog(pkg);

        end({ labels: { status: outgoing.statusCode } });

        return outgoing;
    }
};
module.exports = PkgPut;
