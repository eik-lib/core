import { PassThrough } from 'node:stream';
import FormData from 'form-data';
import path from 'node:path';
import tap from 'tap';
import fs from 'node:fs';

import Handler from '../../lib/handlers/map.put.js';
import Sink from '../../lib/sinks/test.js';

const FIXTURE_MAP = new URL('../../fixtures/import-map.json', import.meta.url);


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
