'use strict';

const { PassThrough } = require('stream');

class HttpOutgoing extends PassThrough {
    constructor() {
        super();
        this._statusCode = 200;
        this._location = '';
        this._mimeType = 'text/plain';
    }

    set statusCode(value) {
        this._statusCode = value;
    }

    get statusCode() {
        return this._statusCode;
    }

    set location(value) {
        this._location = value;
    }

    get location() {
        return this._location;
    }

    set mimeType(value) {
        this._mimeType = value;
    }

    get mimeType() {
        return this._mimeType;
    }

    get [Symbol.toStringTag]() {
        return 'HttpOutgoing';
    }
}
module.exports = HttpOutgoing;
