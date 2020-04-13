'use strict';

const crypto = require('crypto');
const Author = require('./author');
const Asset = require('./asset');
const Meta = require('./meta');

const Package = class Package {
    constructor({ version = '', name = '', org = '' } = {}) {
        this._version = version;
        this._created = -1;
        this._author = {};
        this._type = 'package';
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

    get created() {
        return this._created;
    }

    set created(value) {
        this._created = value;
    }

    get author() {
        return this._author;
    }

    set author(value) {
        if (!(value instanceof Author))
            throw new TypeError(
                'Value must be an instance of Author',
            );
        this._author = value;
    }

    get type() {
        return this._type;
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
            created: this.created,
            type: this.type,
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
