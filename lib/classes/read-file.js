'use strict';

const ReadFile = class ReadFile {
    constructor({
        etag = '',
    } = {}) {
        this._stream = undefined;
        this._etag = etag;
    }

    set stream(value) {
        this._stream = value;
    }

    get stream() {
        return this._stream;
    }

    get etag() {
        return this._etag;
    }

    get [Symbol.toStringTag]() {
        return 'ReadFile';
    }
}
module.exports = ReadFile;
