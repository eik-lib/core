'use strict';

const { PassThrough } = require('stream');
const FormData = require('form-data');
const HttpError = require('http-errors');
const path = require('path');
const tap = require('tap');
const fs = require('fs');

const Handler = require('../../lib/handlers/pkg.put.js');
const Sink = require('../../lib/sinks/test');

const FIXTURE_TAR = path.resolve(__dirname, '../../fixtures/package.tar');
const FIXTURE_BZ2 = path.resolve(__dirname, '../../fixtures/package.tar.bz2');
const FIXTURE_GZ = path.resolve(__dirname, '../../fixtures/package.tar.gz');


const FIXTURE_PKG = path.resolve(__dirname, '../../fixtures/archive.tgz');
const FIXTURE_MAP = path.resolve(__dirname, '../../fixtures/import-map.json');


const Request = class Request extends PassThrough {
    constructor ({
        headers = {}
    } = {}) {
        super();
        this.headers = {host: 'localhost', ...headers};
    }
}


tap.test('pkg.put() - The "type" argument is invalid', (t) => {
    const h = new Handler();
    t.rejects(h.handler({}, 'anton', 'zaaap', 'fuzz', '8.4.1'), new HttpError.BadRequest(), 'should reject with bad request error');
    t.end();
});

tap.test('pkg.put() - The "name" argument is invalid', (t) => {
    const h = new Handler();
    t.rejects(h.handler({}, 'anton', 'pkg', null, '8.4.1'), new HttpError.BadRequest(), 'should reject with bad request error');
    t.end();
});

tap.test('pkg.put() - The "version" argument is invalid', (t) => {
    const h = new Handler();
    t.rejects(h.handler({}, 'anton', 'pkg', 'fuzz', 'zaaap'), new HttpError.BadRequest(), 'should reject with bad request error');
    t.end();
});

tap.test('pkg.put() - Successful upload of .tar file', async (t) => {
    const sink = new Sink();
    const h = new Handler({ sink });

    const formData = new FormData();
    formData.append('package', fs.createReadStream(FIXTURE_TAR));

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    formData.pipe(req);

    const res = await h.handler(req, 'anton', 'pkg', 'fuzz', '8.4.1');

    t.equal(res.cacheControl, 'no-store', '.cacheControl should be "no-store"')
    t.equal(res.statusCode, 303, '.statusCode should be "303"');
    t.equal(res.mimeType, 'text/plain', '.mimeType should be "text/plain"');
    t.equal(res.location, '/pkg/fuzz/8.4.1', '.location should be "/pkg/fuzz/8.4.1"');
    t.end();
});

tap.test('pkg.put() - Successful upload of .tar.gz file', async (t) => {
    const sink = new Sink();
    const h = new Handler({ sink });

    const formData = new FormData();
    formData.append('package', fs.createReadStream(FIXTURE_GZ));

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    formData.pipe(req);

    const res = await h.handler(req, 'anton', 'pkg', 'fuzz', '8.4.1');

    t.equal(res.cacheControl, 'no-store', '.cacheControl should be "no-store"')
    t.equal(res.statusCode, 303, '.statusCode should be "303"');
    t.equal(res.mimeType, 'text/plain', '.mimeType should be "text/plain"');
    t.equal(res.location, '/pkg/fuzz/8.4.1', '.location should be "/pkg/fuzz/8.4.1"');
    t.end();
});

tap.test('pkg.put() - File is not a tar file', (t) => {
    const sink = new Sink();
    const h = new Handler({ sink });

    const formData = new FormData();
    formData.append('package', fs.createReadStream(FIXTURE_MAP));

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    formData.pipe(req);

    t.rejects(h.handler(req, 'anton', 'pkg', 'fuzz', '8.4.1'), new HttpError.UnsupportedMediaType(), 'should reject with unsupported media type error');
    t.end();
});

tap.test('pkg.put() - File is not a compatible file or contain an error', (t) => {
    const sink = new Sink();
    const h = new Handler({ sink });

    const formData = new FormData();
    formData.append('package', fs.createReadStream(FIXTURE_BZ2));

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    formData.pipe(req);

    t.rejects(h.handler(req, 'anton', 'pkg', 'fuzz', '8.4.1'), new HttpError.UnprocessableEntity(), 'should reject with unprocessable entry error');
    t.end();
});

tap.test('pkg.put() - Form field is not valid', (t) => {
    const sink = new Sink();
    const h = new Handler({ sink });

    const formData = new FormData();
    formData.append('pkg', fs.createReadStream(FIXTURE_PKG));

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    formData.pipe(req);

    t.rejects(h.handler(req, 'anton', 'pkg', 'fuzz', '8.4.1'), new HttpError.BadRequest(), 'should reject with bad request error');
    t.end();
});

tap.test('pkg.put() - File exceeds legal file size limit', (t) => {
    const sink = new Sink();
    const h = new Handler({
        pkgMaxFileSize: 100,
        sink
    });

    const formData = new FormData();
    formData.append('package', fs.createReadStream(FIXTURE_PKG));

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    formData.pipe(req);

    t.rejects(h.handler(req, 'anton', 'pkg', 'fuzz', '8.4.1'), new HttpError.PayloadTooLarge(), 'should reject with payload too large error');
    t.end();
});

