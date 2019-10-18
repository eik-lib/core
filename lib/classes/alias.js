'use strict';

const path = require('path');
const { ROOT } = require('../utils/globals');

const FILE_NAME = '/alias.json';

class Alias {
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
/*
    set alias(value) {
        this._alias = value;
    }
*/
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
            type: this.type,
            name: this.name,
            org: this.org,
        };
    }

    get [Symbol.toStringTag]() {
        return 'Alias';
    }

    static buildPathname(
        org = '',
        type = '',
        name = '',
        version = '',
        extras = ''
    ) {
        return path.join(ROOT, org, type, name, version, extras);
    }

    static buildPath(org = '', type = '', name = '', alias = '') {
        return path.join(ROOT, org, type, name, alias, FILE_NAME);
    }
}
module.exports = Alias;
