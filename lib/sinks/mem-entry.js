'use strict';

const crypto = require('crypto');

const Entry = class Entry {
    constructor(payload = []) {
        this._payload = payload;
        this._hash = '';

        if (Array.isArray(payload)) {
            const hash = crypto.createHash('md5');
            payload.forEach(buffer => {
                hash.update(buffer.toString());
            });
            this._hash = hash.digest('hex');
        }
    }

    get payload() {
        return this._payload;
    }

    get hash() {
        return this._hash;
    }

    get [Symbol.toStringTag]() {
        return 'Entry';
    }
}
module.exports = Entry;
