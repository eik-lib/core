'use strict';

const { validators } = require('@eik/common');
const HttpError = require('http-errors');
const abslog = require('abslog');
const Metrics = require('@metrics/client');

const { createFilePathToAlias } = require('../utils/path-builders-fs');
const HttpOutgoing = require('../classes/http-outgoing');
const conf = require('../utils/defaults');

const AliasDel = class AliasDel {
    constructor(sink, config = {}, logger) {
        this._config = { ...conf, ...config };
        this._sink = sink;
        this._log = abslog(logger);
        this._metrics = new Metrics();
        this._histogram = this._metrics.histogram({
            name: 'eik_core_alias_del_handler',
            description:
                'Histogram measuring time taken in @eik/core AliasDel handler method',
            labels: {
                success: true,
            },
        });
    }

    get metrics() {
        return this._metrics;
    }

    async _exist(path = '') {
        try {
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
            this._log.info(`alias:del - Validation failed - ${error.message}`);
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        const path = createFilePathToAlias({ org, type, name, alias });
        const exist = await this._exist(path);
        if (!exist) {
            this._log.info(
                `alias:del - Alias does not exists - Org: ${org} - Type: ${type} - Name: ${name} - Alias: ${alias}`,
            );
            const e = new HttpError.NotFound();
            end({ labels: { success: false, status: e.status } });
            throw e;
        }

        try {
            this._log.info(
                `alias:del - Start deleting alias from sink - Pathname: ${path}`,
            );
            await this._sink.delete(path);
        } catch (error) {
            this._log.error(
                `alias:del - Failed deleting alias from sink - Pathname: ${path}`,
            );
            this._log.trace(error);
            const e = new HttpError.BadGateway();
            end({ labels: { success: false, status: e.status } });
            return e;
        }

        this._log.info(
            `alias:del - Successfully deleted alias from sink - Pathname: ${path}`,
        );

        const outgoing = new HttpOutgoing();
        outgoing.statusCode = 204;

        end({ labels: { status: outgoing.statusCode } });

        return outgoing;
    }
};
module.exports = AliasDel;
