import { PassThrough } from 'node:stream';
import tap from 'tap';

import Handler from '../../lib/handlers/alias.get.js';
import Alias from '../../lib/classes/alias.js';
import Sink from '../../lib/sinks/test.js';

const Request = class Request extends PassThrough {
    constructor ({
        headers = {}
    } = {}) {
        super();
        this.headers = {host: 'localhost', ...headers};
    }
}

tap.test('alias.get() - URL parameters is URL encoded', async (t) => {
    const sink = new Sink();
    const alias = new Alias({
        alias: '8',
        name: '@foo/bar-lib',
        type: 'pkg',
        org: 'localhost',
    });
    alias.version = '8.1.4-1';
    sink.set('/local/pkg/@foo/bar-lib/8.alias.json', JSON.stringify(alias));
    
    const h = new Handler({ sink });
    const req = new Request();
    const res = await h.handler(req, 'pkg', '%40foo%2Fbar-lib', '8', '%2Ffoo%2Fmain.js');

    t.equal(res.statusCode, 302, 'should respond with expected status code');
    t.equal(res.location, '/pkg/@foo/bar-lib/8.1.4-1/foo/main.js', '.location should be decoded');
    t.end();
});
