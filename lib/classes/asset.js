'use strict';

const path = require('path');
const { BASE_ASSETS, ROOT } = require('../utils/globals');

const MIME_DEFAULT = 'application/octet-stream';

const MIME_TYPES = new Map([
    ['.woff2', 'font/woff2'],
    ['.woff', 'font/woff'],
    ['.json', 'application/json'],
    ['.map', 'application/json'],
    ['.css', 'text/css'],
    ['.js', 'application/javascript'],
]);

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
    constructor({ version = '', extra = '', name = '', org = '' } = {}) {
        const ext = path.extname(extra);
        const mime = MIME_TYPES.get(ext);

        this._mimeType = mime || MIME_DEFAULT;
        this._supported = !!mime;
        this._errored = false;
        // this._type = '';
        this._size = -1;

        this._version = version;
        this._extra = extra;
        this._name = name;
        this._org = org;
    }

    /**
     * If the file is of a supported mime type.
     * @readonly
     * @memberof Asset
     */
    get supported() {
        return this._supported;
    }

    get errored() {
        return this._errored;
    }

    set errored(value) {
        this._errored = value;
    }

    /* Used to determine if we deal with a directory or file
       Rename
    get type() {
        return this._type;
    }

    set type(value) {
        this._type = value.toLowerCase();
    }
    */

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
            supported: this._supported,
            mimeType: this._mimeType,
            pathname: this.pathname,
            // type: this._type,
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
