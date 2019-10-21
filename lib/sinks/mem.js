'use strict';

const { Writable, Readable } = require('stream');

/**
 * A sink for persisting files to memory
 *
 * @class SinkMem
 */

class SinkMem {
    constructor() {
        this._state = new Map();
    }

    async write(filePath) {
        const state = [];
        this._state.set(filePath, state);
        return new Writable({
            write(chunk, encoding, callback) {
                try {
                    state.push(chunk.toString());
                    callback();
                } catch (err) {
                    callback(err);
                }
            },
        });
    }

    read(filePath) {
        return Readable.from(this._state.get(filePath) || []);
    }

    async delete(filePath) {
        this._state.set(filePath, null);
    }

    async exist(filePath) {
        return this._state.has(filePath);
    }
}
module.exports = SinkMem;
