'use strict';

const { validators } = require('@eik/common');
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

const AliasPost = class AliasPost {
    constructor(sink, config = {}, logger) {
        this._config = { ...conf, ...config };
        this._sink = sink;
        this._log = abslog(logger);
        this._metrics = new Metrics();
        this._histogram = this._metrics.histogram({
            name: 'eik_core_alias_post_handler',
            description:
                'Histogram measuring time taken in @eik/core AliasPost handler method',
            labels: {
                success: true,
            },
        });
    }

    get metrics() {
        return this._metrics;
    }

    _parser(incoming) {
        return new Promise((resolve, reject) => {
            const pathname = createURIToAlias(incoming);
            const path = createFilePathToAlias(incoming);

            const alias = new Alias(incoming);

            const busboy = new Busboy({
                headers: incoming.headers,
                limits: {
                    fields: 1,
                    files: 0,
                    fileSize: 0,
                },
            });

            busboy.on('field', (name, value) => {
                if (name === 'version') {
                    try {
                        validators.version(value);
                    } catch (error) {
                        this._log.error(
                            `alias:post - Input field could not be validated - Name: ${name} - Value: ${value}`,
                        );
                        this._log.trace(error);
                        busboy.destroy(new HttpError.BadRequest());
                        return;
                    }
                    this._log.info(
                        `alias:post - Input field added - Name: ${name} - Value: ${value}`,
                    );
                    alias.version = value;
                }
            });

            busboy.on('finish', async () => {
                this._log.info(
                    `alias:post - Start writing alias to sink - Pathname: ${path}`,
                );

                try {
                    await utils.writeJSON(
                        this._sink,
                        path,
                        alias,
                        'application/json',
                    );
                } catch (error) {
                    // TODO: Will this trigger error or is it too late to do this in the finish event??????????
                    this._log.error(
                        `alias:post - Failed writing alias to sink - Pathname: ${path}`,
                    );
                    this._log.trace(error);
                    busboy.destroy(new HttpError.BadGateway());
                    return;
                }

                this._log.info(
                    `alias:post - Successfully wrote alias to sink - Pathname: ${path}`,
                );

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
    }

    async _exist(incoming) {
        try {
            const path = createFilePathToAlias(incoming);
            await this._sink.exist(path);
            return true;
        } catch (error) {
            return false;
        }
    }

    async handler(req, org, type, name, alias) {
        const end = this._histogram.timer();

        try {
            validators.alias(alias);
            validators.name(name);
            validators.type(type);
            validators.org(org);
        } catch (error) {
            this._log.info(`alias:post - Validation failed - ${error.message}`);
            const e = new HttpError.NotFound();
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
        if (!exist) {
            this._log.info(
                `alias:post - Alias does not exists - Org: ${org} - Type: ${type} - Name: ${name} - Alias: ${alias}`,
            );
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        const outgoing = await this._parser(incoming);

        end({ labels: { status: outgoing.statusCode } });

        return outgoing;
    }
};
module.exports = AliasPost;
