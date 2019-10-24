'use strict';

const mime = require('mime/lite');
const path = require('path');
const { BASE_ASSETS, ROOT } = require('../utils/globals');

/**
 * Meta information about an Asset.
 * @class Asset
 */
class Asset {
    /**
     * Creates an instance of Asset.
     * @param {string} [base=''] Base file path. Should contain the extension of the asset.
     * @param {string} [dir=''] Directory path to the asset. Will be prefixed to "base".
     * @memberof Asset
     */
    constructor({
        version = '',
        extra = '',
        name = '',
        type = '',
        org = '',
    } = {}) {
        this._mimeType = mime.getType(extra);
        this._type = type.toLowerCase();
        this._size = -1;

        this._version = version;
        this._extra = extra;
        this._name = name;
        this._org = org;
    }

    get type() {
        return this._type;
    }

    set type(value) {
        this._type = value.toLowerCase();
    }

    get size() {
        return this._size;
    }

    set size(value) {
        this._size = value;
    }

    // URL pathname to the asset
    get pathname() {
        return this.constructor.buildPathname(
            this._org,
            this._name,
            this._version,
            this._extra,
        );
    }

    // File system path to the asset
    get path() {
        return this.constructor.buildPath(
            this._org,
            this._name,
            this._version,
            this._extra,
        );
    }

    /**
     * Mime type of the asset
     * @readonly
     * @memberof Asset
     */
    get mimeType() {
        return this._mimeType;
    }

    toJSON() {
        return {
            mimeType: this._mimeType,
            pathname: this.pathname,
            type: this._type,
            size: this._size,
        };
    }

    get [Symbol.toStringTag]() {
        return 'Asset';
    }

    static buildPathname(org = '', name = '', version = '', extra = '') {
        return path.join(ROOT, org, BASE_ASSETS, name, version, extra);
    }

    static buildPath(org = '', name = '', version = '', extra = '') {
        return path.join(ROOT, org, BASE_ASSETS, name, version, extra);
    }
}
module.exports = Asset;
