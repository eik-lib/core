import originalUrl from 'original-url';
import HttpError from 'http-errors';
import abslog from 'abslog';
import Metrics from '@metrics/client';

import { createFilePathToAsset } from '../utils/path-builders-fs.js';
import { decodeUriComponent } from '../utils/utils.js';
import HttpIncoming from '../classes/http-incoming.js';
import HttpOutgoing from '../classes/http-outgoing.js';
import Asset from '../classes/asset.js';
import config from '../utils/defaults.js';

const PkgGet = class PkgGet {
    constructor({
        organizations,
        cacheControl,
        plugins,
        logger,
        sink,
        etag,
    } = {}) {
        this._organizations = organizations || config.organizations;
        this._cacheControl = cacheControl || 'public, max-age=31536000, immutable';
        this._sink = sink;
        this._etag = etag || config.etag;
        this._log = abslog(logger);

        this._metrics = new Metrics();
        this._histogram = this._metrics.histogram({
            name: 'eik_core_pkg_get_handler',
            description:
                'Histogram measuring time taken in @eik/core PkgGet handler method',
            labels: {
                success: true,
                type: 'unknown'
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
        this._plugins = plugins || [];
    }

    get metrics() {
        return this._metrics;
    }

    async handler(req, type, name, version, extra) {
        const end = this._histogram.timer();
        const incoming = new HttpIncoming(req);
        incoming.handle = `put:${type}:version`;

        try {
            incoming.version = decodeUriComponent(version);
            incoming.extras = decodeUriComponent(extra);
            incoming.name = decodeUriComponent(name);
            incoming.type = type;

        } catch (error) {
            this._log.debug(`pkg:get - Validation failed - ${error.message}`);
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        const url = originalUrl(req);
        incoming.org = this._orgRegistry.get(url.hostname);

        if (!incoming.org) {
            this._log.info(`pkg:get - Hostname does not match a configured organization - ${url.hostname}`);
            const e = new HttpError.InternalServerError();
            end({ labels: { success: false, status: e.status, type } });
            throw e;
        }



        // Run On Request Start plugin methods
        if (this._plugins.length !== 0) {
            const pluginStart = this._plugins.map((plugin) => plugin.onRequestStart(incoming)).filter(plugin => plugin !== undefined);
    
            if (pluginStart.length !== 0) {
                try {
                    await Promise.all(pluginStart);
                } catch (error) {
                    this._log.info(`pkg:put - A plugin errored during on request start exection - ${error.message}`);
                    const e = new HttpError.InternalServerError();
                    end({ labels: { success: false, status: e.status, type } });
                    throw e;
                }
            }
        }



        const asset = new Asset({
            pathname: incoming.extras,
            version: incoming.version,
            name: incoming.name,
            type: incoming.type,
            org: incoming.org,
        });

        const path = createFilePathToAsset(asset);

        const outgoing = new HttpOutgoing();
        outgoing.cacheControl = this._cacheControl;
        outgoing.mimeType = asset.mimeType;

        try {
            const file = await this._sink.read(path);

            if (this._etag) {
                outgoing.etag = file.etag;
            }

            if (
                this._etag &&
                req.headers['if-none-match'] === file.etag
            ) {
                outgoing.statusCode = 304;
                file.stream.destroy();
            } else {
                outgoing.statusCode = 200;
                outgoing.stream = file.stream;
            }

        } catch (error) {
            this._log.debug(`pkg:get - Asset not found - Pathname: ${path}`);
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: e.status, type } });
            throw e;
        }


        
        // Run On Request End plugin methods
        if (this._plugins.length !== 0) {
            const pluginEnd = this._plugins.map((plugin) => plugin.onRequestEnd(incoming, outgoing)).filter(plugin => plugin !== undefined);
    
            if (pluginEnd.length !== 0) {
                try {
                    await Promise.all(pluginEnd);
                } catch (error) {
                    this._log.info(`pkg:put - A plugin errored during on request end exection - ${error.message}`);
                    const e = new HttpError.InternalServerError();
                    end({ labels: { success: false, status: e.status, type } });
                    throw e;
                }
            }
        }



        this._log.debug(`pkg:get - Asset found - Pathname: ${path}`);

        end({ labels: { status: outgoing.statusCode, type } });
        return outgoing;
    }
};
export default PkgGet;
