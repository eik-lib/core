'use strict';

const { validators } = require('@eik/common');
const HttpError = require('http-errors');
const Busboy = require('busboy');
const abslog = require('abslog');
const Metrics = require('@metrics/client');

const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const conf = require('../utils/defaults');

const AuthPost = class AuthPost {
    constructor(config = {}, logger) {
        this._config = { ...conf, ...config };
        this._log = abslog(logger);
        this._metrics = new Metrics();
        this._histogram = this._metrics.histogram({
            name: 'eik_core_auth_post_handler',
            description:
                'Histogram measuring time taken in @eik/core AuthPost handler method',
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
                    value,
                    name,
                }));
            });

            busboy.on('finish', () => {
                Promise.all(queue).then(() => {
                    resolve({
                        username: 'generic_user',
                        role: 'user',
                    });
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

    async _handleField({ name, value }) {
        // We accept only the "key" field
        // Throw if any other fields is posted.
        if (name !== 'key') {
            this._log.info(`auth:post - Auth submitted an illegal field name - Name: ${name} - Value: ${value}`);
            throw new HttpError.BadRequest();
        }

        if (value !== this._config.authKey) {
            this._log.info(`auth:post - Auth submitted an illegal key: ${value}`);
            throw new HttpError.Unauthorized();
        }

        return { name, value };
    }

    async handler(req, org) {
        const end = this._histogram.timer();

        try {
            validators.org(org);
        } catch (error) {
            this._log.info(`auth:post - Validation failed - ${error.message}`);
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        const incoming = new HttpIncoming(req, {
            org,
        });

        const obj = await this._parser(incoming);

        const outgoing = new HttpOutgoing();
        outgoing.mimeType = 'application/json';
        outgoing.statusCode = 200;
        outgoing.body = obj;

        end({ labels: { status: outgoing.statusCode } });

        return outgoing;
    }
};
module.exports = AuthPost;