import { PassThrough } from 'node:stream';
import FormData from 'form-data';
import tap from 'tap';

import Handler from '../../lib/handlers/alias.delete.js';
import Sink from '../../lib/sinks/test.js';

const Request = class Request extends PassThrough {
    constructor ({
        headers = {}
    } = {}) {
        super();
        this.headers = {host: 'localhost', ...headers};
    }
}

tap.test('alias.delete() - URL parameters is URL encoded', async (t) => {
    const sink = new Sink();
    sink.set('/local/pkg/@foo/foo-bar/8.alias.json', 'payload');

    const h = new Handler({ sink });
    
    const formData = new FormData();
    formData.append('version', '8.1.4-1');

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    formData.pipe(req);

    const res = await h.handler(req, 'anton', 'pkg', '%40foo%2Ffoo-bar', '8');

    t.equal(res.statusCode, 204, 'should respond with expected status code');
    t.equal(sink.get('/pkg/@foo/foo-bar/8.alias.json'), null, 'should delete alias from sink');
    t.end();
});
