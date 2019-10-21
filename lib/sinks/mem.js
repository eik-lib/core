'use strict';

const { Writable, Readable } = require('stream');

/**
 * A sink for persisting files to memory
 *
 * @class SinkMem
 */

class SinkMem {
    constructor() {
        this._state = {};
    }

    async write(filePath) {
        const state = this._state;
        state[filePath] = [];
        return new Writable({
            write(chunk, encoding, callback) {
                try {
                    state[filePath].push(chunk.toString());
                    callback();
                } catch (err) {
                    callback(err);
                }
            },
        });
    }

    read(filePath) {
        return Readable.from(this._state[filePath] || []);
    }

    async delete(filePath) {
        this._state[filePath] = null;
    }

    async exist(filePath) {
        return !!this._state[filePath];
    }
}
module.exports = SinkMem;
