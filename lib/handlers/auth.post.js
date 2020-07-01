'use strict';

const originalUrl = require('original-url');
const HttpError = require('http-errors');
const Metrics = require('@metrics/client');
const abslog = require('abslog');

const MultipartParser = require('../multipart/parser');
const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const Author = require('../classes/author');
const config = require('../utils/defaults');

const AuthPost = class AuthPost {
    constructor({
        organizations,
        cacheControl,
        authKey,
        logger,
    } = {}) {
        this._organizations = organizations || config.organizations;
        this._cacheControl = cacheControl;
        this._authKey = authKey || config.authKey;
        this._log = abslog(logger);
        this._metrics = new Metrics();
        this._histogram = this._metrics.histogram({
            name: 'eik_core_auth_post_handler',
            description:
                'Histogram measuring time taken in @eik/core AuthPost handler method',
            labels: {
                success: true,
            },
            buckets: [
                0.005,
                0.01,
                0.06,
                0.1,
                0.6,
                1.0,
                2.0,
                4.0,
            ],
        });
        this._orgRegistry = new Map(this._organizations);

        this._multipart = new MultipartParser({
            pkgMaxFileSize: this._pkgMaxFileSize,
            legalFields: ['key'],
            sink: this._sink,
        });
    }

    get metrics() {
        return this._metrics;
    }

    _parser(incoming) {
        return new Promise((resolve, reject) => {
            this._multipart.parse(incoming).then((result) => {
                const obj = result[0];
                if (obj && obj.constructor.name === 'FormField') {
                    if (obj.value !== this._authKey) {
                        this._log.info(`auth:post - Auth submitted an illegal key: ${obj.value}`);
                        throw new HttpError.Unauthorized();
                    }
                    const author = new Author({
                        user: 'generic_user',
                        name: 'Generic User',
                    });
                    resolve(author);
                    return;
                }
                throw new HttpError.BadRequest();
            }).catch((error) => {
                reject(error);
            });
        });
    }

    async handler(req) {
        const end = this._histogram.timer();

        const url = originalUrl(req);
        const org = this._orgRegistry.get(url.hostname);

        if (!org) {
            this._log.info(`auth:post - Hostname does not match a configured organization - ${url.hostname}`);
            const e = new HttpError.InternalServerError();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        const incoming = new HttpIncoming(req, {
            org,
        });

        const obj = await this._parser(incoming);

        const outgoing = new HttpOutgoing();
        outgoing.cacheControl = this._cacheControl;
        outgoing.statusCode = 200;
        outgoing.mimeType = 'application/json';
        outgoing.body = obj;

        end({ labels: { status: outgoing.statusCode } });

        return outgoing;
    }
};
module.exports = AuthPost;
