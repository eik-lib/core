'use strict';

class ImportMapEntry {
    constructor({
        specifier = '',
        address = '',
    } = {}) {
        this._specifier = specifier;
        this._address = address;
    }

    get specifier() {
        return this._specifier;
    }

    set specifier(value) {
        this._specifier = value;
    }

    get address() {
        return this._address;
    }

    set address(value) {
        this._address = value;
    }

    valid() {
        return this._specifier !== '' && this._address !== '';
    }
}
module.exports = ImportMapEntry;
