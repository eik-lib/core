'use strict';

const { Transform } = require('stream');
const crypto = require('crypto');

const StreamHash = class StreamHash extends Transform {
  constructor() {
    super();
    this._hasher = crypto.createHash('sha512');
    this._hash = '';
  }

  _transform (chunk, enc, cb) {
    this._hasher.update(chunk)
    this.push(chunk);
    cb()
  }

  get hash() {
    if (this._hash === '') {
        this._hash = `sha512-${this._hasher.digest(
            'base64',
        )}`;
    }
    return this._hash;
  }
}
module.exports = StreamHash;
