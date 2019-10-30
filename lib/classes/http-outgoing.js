'use strict';

class HttpOutgoing {
    constructor() {
        this._statusCode = 200;
        this._mimeType = 'text/plain';
        this._location = '';
        this._stream = undefined;
        this._body = undefined;
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

    set stream(value) {
        this._stream = value;
    }

    get stream() {
        return this._stream;
    }

    set body(value) {
        this._body = value;
    }

    get body() {
        return this._body;
    }

    get [Symbol.toStringTag]() {
        return 'HttpOutgoing';
    }
}
module.exports = HttpOutgoing;
