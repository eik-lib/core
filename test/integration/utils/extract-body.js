'use strict';

const { Writable } = require('stream');

function extractBody(res) {
    return new Promise((resolve, reject) => {
        const buff = [];
        const stream = new Writable({
            objectMode: false,
            write(chunk, encoding, callback) {
                try {
                    buff.push(JSON.parse(chunk.toString()));
                } catch (err) {
                    buff.push(chunk.toString());
                }
                callback();
            },
        });
        res.body.pipe(stream);
        res.body.on('error', reject);
        res.body.on('end', () => {
            resolve(buff);
        });
    });
}

module.exports = extractBody;
