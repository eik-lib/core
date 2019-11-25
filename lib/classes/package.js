'use strict';

const crypto = require('crypto');
const Asset = require('./asset');
const Meta = require('./meta');

const Package = class Package {
    constructor({ version = '', name = '', org = '' } = {}) {
        this._version = version;
        this._name = name;
        this._org = org;
        this._files = [];
        this._meta = [];
    }

    get integrity() {
        const hasher = crypto.createHash('sha512');
        const hashes = this._files.map(file => {
            return file.integrity;
        });

        for (const hash of hashes.sort()) {
            hasher.update(hash);
        }
        
        return `sha512-${hasher.digest('base64')}`;
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
            integrity: this.integrity,
            version: this.version,
            name: this.name,
            org: this.org,
            files: this._files,
            meta: this._meta,
        }
    }

    get [Symbol.toStringTag]() {
        return 'Package';
    }
}
module.exports = Package;
