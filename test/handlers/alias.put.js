'use strict';

const { PassThrough } = require('stream');
const FormData = require('form-data');
const tap = require('tap');
const HttpError = require('http-errors');

const Handler = require('../../lib/handlers/alias.put.js');
const Sink = require('../../lib/sinks/test');

const Request = class Request extends PassThrough {
    constructor ({
        headers = {}
    } = {}) {
        super();
        this.headers = {host: 'localhost', ...headers};
    }
}


tap.test('alias.put() - URL parameters is URL encoded', async (t) => {
    const sink = new Sink();
    sink.set('/local/pkg/@foo/bar-lib/8.1.4-1.package.json', 'payload');
    const h = new Handler({ sink });

    const formData = new FormData();
    formData.append('version', '8.1.4-1');

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    formData.pipe(req);

    const res = await h.handler(req, 'anton', 'pkg', '%40foo%2Fbar-lib', '8');

    t.equal(res.statusCode, 303, 'should respond with expected status code');
    t.equal(res.location, '/pkg/@foo/bar-lib/v8', '.location should be decoded');
    t.end();
});

tap.test('alias.put() - Prevent unexisting alias', async (t) => {
    const sink = new Sink();
    const h = new Handler({ sink });

    const formData = new FormData();
    formData.append('version', '8.1.4-1');

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    formData.pipe(req);

    const res = h.handler(req, 'anton', 'pkg', '%40foo%2Fbar-lib', '8');

    t.rejects(res, HttpError.NotFound)

    t.end();
});
