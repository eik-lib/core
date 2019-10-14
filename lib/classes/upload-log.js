'use strict';

const Asset = require('./asset');

class UploadLog {
    constructor({
        version = '',
        name = '',
        org = '',
    } = {}) {
        this._version = version;
        this._name = name;
        this._org = org;

        this._fields = [];
        this._files = [];
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

    get success() {
        return this._success;
    }

    setField(key, value) {
        this._fields.push({
            key,
            value
        });
    }

    setAsset(asset) {
        if(!(asset instanceof Asset)) throw new TypeError('Argument "asset" must be an instance of Asset');
        this._files.push(asset);
    }

    toJSON() {
        return {
            version: this._version,
            name: this._name,
            org: this._org,
            fields: this._fields,
            files: this._files,
        }
    }
}
module.exports = UploadLog;
