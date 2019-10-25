'use strict';

const path = require('path');
const { BASE_IMPORT_MAPS, ROOT } = require('../utils/globals');

class ImportMap {
    constructor({ imports = {} } = {}) {
        this._imports = new Map();

        for (const [specifier, address] of Object.entries(imports)) {
            this._imports.set(specifier, address);
        }
    }

    setImport({ specifier, address } = {}) {
        this._imports.set(specifier, address);
    }

    getImport(specifier) {
        return this._imports.get(specifier);
    }

    toJSON() {
        return {
            // TODO; Node 12 only; investigate 10.x support
            imports: Object.fromEntries(this._imports),
        };
    }

    get [Symbol.toStringTag]() {
        return 'ImportMap';
    }

    static buildPathname(org = '', name = '', version = '') {
        return path.join(ROOT, org, BASE_IMPORT_MAPS, name, version);
    }

    static buildPath(org = '', name = '', version = '') {
        return path.join(ROOT, org, BASE_IMPORT_MAPS, name, `${version}.json`);
    }
}
module.exports = ImportMap;
