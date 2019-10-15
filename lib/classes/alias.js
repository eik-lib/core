'use strict';

const path = require('path');
const { BASE_ASSETS, BASE_ALIAS, ROOT } = require('../utils/globals');

const FILE_NAME = '/alias.json';

class Alias {
    constructor({ name = '', type = '', org = '' } = {}) {
        this._version = '';
        this._alias = '';
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
            this._type,
            this._name,
            this._version
        );
    }

    // File system path to this file
    get path() {
        return this.constructor.buildPath(
            this._org,
            this._type,
            this._name,
            this._alias
        );
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
            pathname: this.pathname,
            version: this.version,
            alias: this.alias,
            name: this.name,
            type: this.type,
            org: this.org,
        };
    }

    static buildPathname(
        org = '',
        type = '',
        name = '',
        version = '',
        extras = ''
    ) {
        return path.join(ROOT, org, BASE_ASSETS, type, name, version, extras);
    }

    static buildPath(org = '', type = '', name = '', alias = '') {
        return path.join(ROOT, org, BASE_ALIAS, type, name, alias, FILE_NAME);
    }
}
module.exports = Alias;
