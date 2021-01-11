'use strict';

const { PassThrough } = require('stream');
const FormData = require('form-data');
const path = require('path');
const tap = require('tap');
const fs = require('fs');

const Handler = require('../../lib/handlers/map.put.js');
const Sink = require('../../lib/sinks/test');

const FIXTURE_MAP = path.resolve(__dirname, '../../fixtures/import-map.json');


const Request = class Request extends PassThrough {
    constructor ({
        headers = {}
    } = {}) {
        super();
        this.headers = {host: 'localhost', ...headers};
    }
}

tap.test('map.put() - URL parameters is URL encoded', async (t) => {
    const sink = new Sink();
    const h = new Handler({ sink });

    const formData = new FormData();
    formData.append('map', fs.createReadStream(FIXTURE_MAP));

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    formData.pipe(req);

    const res = await h.handler(req, 'anton', '%40foo%2Fbar-lib', '8%2E1%2E4%2D1');

    t.equal(res.statusCode, 303, 'should respond with expected status code');
    t.equal(res.location, '/map/@foo/bar-lib/8.1.4-1', '.location should be decoded');
    t.end();
});
