'use strict';

const { Writable, PassThrough, pipeline } = require('stream');
const tap = require('tap');

const Handler = require('../../lib/handlers/versions.get.js');
const Sink = require('../../lib/sinks/test');

const pipeInto = (...streams) => new Promise((resolve, reject) => {
    const buffer = [];

    const to = new Writable({
        objectMode: false,
        write(chunk, encoding, callback) {
            buffer.push(chunk);
            callback();
        },
    });

    pipeline(...streams, to, error => {
        if (error) return reject(error);
        const str = buffer.join('').toString();
        return resolve(str);
    });
})

const Request = class Request extends PassThrough {
    constructor ({
        headers = {}
    } = {}) {
        super();
        this.headers = {host: 'localhost', ...headers};
    }
}

tap.test('versions.get() - URL parameters is URL encoded', async (t) => {
    const sink = new Sink();
    sink.set('/local/pkg/@foo/bar-lib/versions.json', 'payload');

    const h = new Handler({ sink });
    const req = new Request();

    const res = await h.handler(req, 'pkg', '%40foo%2Fbar-lib');
    const result = await pipeInto(res.stream);

    t.equal(res.statusCode, 200, 'should respond with expected status code');
    t.equal(result, 'payload', 'should be possible to retrieve a payload when handlers values is URL encoded');
    t.end();
});
