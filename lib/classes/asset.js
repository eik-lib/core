'use strict';

const mime = require('mime/lite');
const path = require('path');

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
        pathname = '',
        version = '',
        name = '',
        type = '',
        org = '',
    } = {}) {
        this._mimeType = mime.getType(pathname);
        this._type = type.toLowerCase();
        this._size = -1;

        this._pathname = path.join('/', pathname);;
        this._version = version;
        this._name = name;
        this._org = org;
    }

    get version() {
        return this._version;
    }

    get pathname() {
        return this._pathname;
    }

    // Alias for pathname
    get asset() {
        return this._pathname;
    }

    get name() {
        return this._name;
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

    get org() {
        return this._org;
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
            pathname: this._pathname,
            mimeType: this._mimeType,
            type: this._type,
            size: this._size,
        };
    }

    get [Symbol.toStringTag]() {
        return 'Asset';
    }
}
module.exports = Asset;
