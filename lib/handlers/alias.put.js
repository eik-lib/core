'use strict';

const { validators } = require('@eik/common');
const originalUrl = require('original-url');
const HttpError = require('http-errors');
const Busboy = require('busboy');
const abslog = require('abslog');
const Metrics = require('@metrics/client');

const { createFilePathToAlias } = require('../utils/path-builders-fs');
const { createURIToAlias } = require('../utils/path-builders-uri');
const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const Alias = require('../classes/alias');
const utils = require('../utils/utils');
const conf = require('../utils/defaults');

const AliasPut = class AliasPut {
    constructor(sink, config = {}, logger) {
        this._config = { ...conf, ...config };
        this._sink = sink;
        this._log = abslog(logger);
        this._metrics = new Metrics();
        this._histogram = this._metrics.histogram({
            name: 'eik_core_alias_put_handler',
            description:
                'Histogram measuring time taken in @eik/core AliasPut handler method',
            labels: {
                success: true,
            },
        });

        const orgConf = [
            ['localhost', 'local'],
            ['127.0.0.1', 'local'],
        ];

        this._orgRegistry = new Map(orgConf);
    }

    get metrics() {
        return this._metrics;
    }

    _parser(incoming) {
        return new Promise((resolve, reject) => {
            const path = createFilePathToAlias(incoming);
            const queue = [];

            const busboy = new Busboy({
                headers: incoming.headers,
                limits: {
                    fields: 1,
                    files: 0,
                    fileSize: 0,
                },
            });

            busboy.on('field', (name, value) => {
                queue.push(this._handleField({
                    incoming,
                    value,
                    name,
                    path,
                }));
            });

            busboy.on('finish', () => {
                Promise.all(queue).then(() => {
                    resolve();
                }).catch(error => {
                    reject(error);
                });
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

    async _handleField({ name, value, path, incoming }) {
        // We accept only the "version" field
        // Throw if any other fields is posted.
        if (name !== 'version') {
            this._log.info(`alias:put - Alias submitted on wrong field name - Name: ${name} - Value: ${value}`);
            throw new HttpError.BadRequest();
        }

        const alias = new Alias(incoming);

        try {
            validators.version(value);
        } catch (error) {
            this._log.error(`alias:put - Input field could not be validated - Name: ${name} - Value: ${value}`);
            this._log.trace(error);
            throw new HttpError.BadRequest();
        }

        this._log.debug(`alias:put - Input field added - Name: ${name} - Value: ${value}`);
        alias.version = value;

        this._log.info(`alias:put - Start writing alias to sink - Pathname: ${path}`);

        try {
            await utils.writeJSON(
                this._sink,
                path,
                alias,
                'application/json',
            );
        } catch (error) {
            this._log.error(`alias:put - Failed writing alias to sink - Pathname: ${path}`);
            this._log.trace(error);
            throw new HttpError.BadGateway();
        }

        this._log.info(`alias:put - Successfully wrote alias to sink - Pathname: ${path}`);

        return alias;
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

    async handler(req, type, name, alias) {
        const end = this._histogram.timer();



        const url = originalUrl(req);
        const org = this._orgRegistry.get(url.hostname);

        if (!org) {
            this._log.info(`pkg:put - Hostname does not match a configured organization - ${url.hostname}`);
            const e = new HttpError.BadRequest();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }



        try {
            validators.alias(alias);
            validators.name(name);
            validators.type(type);
            // validators.org(org);
        } catch (error) {
            this._log.info(`alias:put - Validation failed - ${error.message}`);
            const e = new HttpError.BadRequest();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        const incoming = new HttpIncoming(req, {
            alias,
            name,
            type,
            org,
        });

        const exist = await this._exist(incoming);
        if (exist) {
            this._log.info(
                `alias:put - Alias exists - Org: ${org} - Type: ${type} - Name: ${name} - Alias: ${alias}`,
            );
            const e = new HttpError.Conflict();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        await this._parser(incoming);

        const outgoing = new HttpOutgoing();
        outgoing.mimeType = 'text/plain';
        outgoing.statusCode = 303;
        outgoing.location = createURIToAlias(incoming);

        end({ labels: { status: outgoing.statusCode } });

        return outgoing;
    }
};
module.exports = AliasPut;
