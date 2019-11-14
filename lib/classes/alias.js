'use strict';

const Alias = class Alias {
    constructor({ name = '', type = '', alias = '', org = '' } = {}) {
        this._version = '';
        this._alias = alias;
        this._name = name;
        this._type = type;
        this._org = org;
    }

    set version(value) {
        this._version = value;
    }

    get version() {
        return this._version;
    }

    get alias() {
        return this._alias;
    }

    get name() {
        return this._name;
    }

    get type() {
        return this._type;
    }

    get org() {
        return this._org;
    }

    toJSON() {
        return {
            version: this.version,
            alias: this.alias,
            type: this.type,
            name: this.name,
            org: this.org,
        };
    }

    get [Symbol.toStringTag]() {
        return 'Alias';
    }
}
module.exports = Alias;
