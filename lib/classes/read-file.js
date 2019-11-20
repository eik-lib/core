'use strict';

const { isReadableStream } = require('../utils/utils');

const ReadFile = class ReadFile {
    constructor({
        etag = '',
    } = {}) {
        this._stream = undefined;
        this._etag = etag;
    }

    set stream(value) {
        if (!isReadableStream(value)) throw new Error('Value is not a Readable stream');
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
