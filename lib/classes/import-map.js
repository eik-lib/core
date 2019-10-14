'use strict';

const { BASE_IMPORT_MAPS, ROOT } = require('../utils/globals');
const path = require('path');

const FILE_NAME = '/import-map.json';

class ImportMap {
    constructor({
        imports = {},
    } = {}) {
        this._imports = new Map();

        for (let [specifier, address] of Object.entries(imports)) {
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
        }
    }

    static buildPathname(org = '', type = '', name = '') {
        return path.join(
            ROOT,
            org,
            BASE_IMPORT_MAPS,
            type,
            name,
        );
    }

    static buildPath(org = '', type = '', name = '') {
        return path.join(
            ROOT,
            org,
            BASE_IMPORT_MAPS,
            type,
            name,
            FILE_NAME,
        );
    }
}
module.exports = ImportMap;
