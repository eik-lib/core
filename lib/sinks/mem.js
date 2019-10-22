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

    set(path, contents) {
        this._state.set(path, [contents]);
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
        const stream = new Readable();
        const state = this._state.get(filePath) || [];
        for (const chunk of state) {
            stream.push(chunk);
        }
        stream.push(null);
        return stream;
    }

    async delete(filePath) {
        this._state.set(filePath, null);
    }

    async exist(filePath) {
        return this._state.has(filePath);
    }
}
module.exports = SinkMem;
