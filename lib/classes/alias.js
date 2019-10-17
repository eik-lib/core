'use strict';

const path = require('path');
const { BASE_ASSETS, BASE_ALIAS, ROOT } = require('../utils/globals');

const FILE_NAME = '/alias.json';

class Alias {
    constructor({ name = '', org = '' } = {}) {
        this._version = '';
        this._alias = '';
        this._name = name;
        this._org = org;
    }

    set version(value) {
        this._version = value;
    }

    get version() {
        return this._version;
    }

    set alias(value) {
        this._alias = value;
    }

    get alias() {
        return this._alias;
    }

    // URL pathname to root of full version
    get pathname() {
        return this.constructor.buildPathname(
            this._org,
            this._name,
            this._version
        );
    }

    // File system path to this file
    get path() {
        return this.constructor.buildPath(
            this._org,
            this._name,
            this._alias
        );
    }

    get name() {
        return this._name;
    }

    get org() {
        return this._org;
    }

    toJSON() {
        return {
            pathname: this.pathname,
            version: this.version,
            alias: this.alias,
            name: this.name,
            org: this.org,
        };
    }

    get [Symbol.toStringTag]() {
        return 'Alias';
    }

    static buildPathname(
        org = '',
        name = '',
        version = '',
        extras = ''
    ) {
        return path.join(ROOT, org, BASE_ASSETS, name, version, extras);
    }

    static buildPath(org = '', name = '', alias = '') {
        return path.join(ROOT, org, BASE_ALIAS, name, alias, FILE_NAME);
    }
}
module.exports = Alias;
