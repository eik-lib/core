'use strict';

const path = require('path');
const Asset = require('./asset');
const Meta = require('./meta');
const { BASE_ASSETS, ROOT } = require('../utils/globals');

class UploadLog {
    constructor({ version = '', name = '', org = '' } = {}) {
        this._version = version;
        this._name = name;
        this._org = org;

        this._files = [];
        this._meta = [];
    }

    get version() {
        return this._version;
    }

    get name() {
        return this._name;
    }

    get org() {
        return this._org;
    }

    // URL pathname to the asset
    get pathname() {
        return this.constructor.buildPathname(
            this._org,
            this._name,
            this._version,
        );
    }

    // File system path to the asset
    get path() {
        return this.constructor.buildPath(
            this._org,
            this._name,
            this._version,
        );
    }

    setAsset(asset) {
        if (!(asset instanceof Asset))
            throw new TypeError(
                'Argument "asset" must be an instance of Asset',
            );
        this._files.push(asset);
    }

    setMeta(meta) {
        if (!(meta instanceof Meta))
            throw new TypeError(
                'Argument "meta" must be an instance of Meta',
            );
        this._meta.push(meta);
    }

    toJSON() {
        return {
            pathname: this.pathname,
            version: this.version,
            name: this.name,
            org: this.org,
            files: this._files,
            meta: this._meta,
        }
    }

    get [Symbol.toStringTag]() {
        return 'UploadLog';
    }

    static buildPathname(org = '', name = '', version = '') {
        return path.join(
            ROOT,
            org,
            BASE_ASSETS,
            name,
            `${version}.log.json`,
        );
    }

    static buildPath(org = '', name = '', version = '') {
        return path.join(
            ROOT,
            org,
            BASE_ASSETS,
            name,
            `${version}.log.json`,
        );
    }
}
module.exports = UploadLog;
