'use strict';

const { PassThrough } = require('stream');
const FormData = require('form-data');
const HttpError = require('http-errors');
const path = require('path');
const tap = require('tap');
const fs = require('fs');

const MultipartParser = require('../../lib/multipart/parser');
const HttpIncoming = require('../../lib/classes/http-incoming');
const Sink = require('../../lib/sinks/mem');

const FIXTURE_TAR = path.resolve(__dirname, '../../fixtures/package.tar');
const FIXTURE_BZ2 = path.resolve(__dirname, '../../fixtures/package.tar.bz2');
const FIXTURE_GZ = path.resolve(__dirname, '../../fixtures/package.tar.gz');
const FIXTURE_PKG = path.resolve(__dirname, '../../fixtures/archive.tgz');

const Request = class Request extends PassThrough {
    constructor ({
        headers = {}
    } = {}) {
        super();
        this.headers = {host: 'localhost', ...headers};
    }
}

tap.test('Parser() - Object type', (t) => {
    const obj = new MultipartParser();
    t.equal(Object.prototype.toString.call(obj), '[object MultipartParser]', 'should be MultipartParser');
    t.end();
});

tap.test('Parser() - Request contains multiple files and fields', async (t) => {
    const multipart = new MultipartParser({
        legalFields: ['foo', 'bar'],
        legalFiles: ['tgz', 'tar'],
        sink: new Sink(),
    });

    const formData = new FormData();
    formData.append('tgz', fs.createReadStream(FIXTURE_GZ));
    formData.append('foo', 'value-foo');
    formData.append('bar', 'value-bar');
    formData.append('tar', fs.createReadStream(FIXTURE_TAR));

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    const incoming = new HttpIncoming(req, {
        version: '1.1.1',
        author: {},
        type: 'pkg',
        name: 'buz',
        org: 'biz',
    });

    formData.pipe(req);

    const result = await multipart.parse(incoming);

    t.matchSnapshot(result, 'parsed request should match snapshot');
    t.end();
});

tap.test('Parser() - Request contains only files', async (t) => {
    const multipart = new MultipartParser({
        legalFiles: ['tgz', 'tar'],
        sink: new Sink(),
    });

    const formData = new FormData();
    formData.append('tgz', fs.createReadStream(FIXTURE_GZ));
    formData.append('tar', fs.createReadStream(FIXTURE_TAR));

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    const incoming = new HttpIncoming(req, {
        version: '1.1.1',
        author: {},
        type: 'pkg',
        name: 'buz',
        org: 'biz',
    });

    formData.pipe(req);

    const result = await multipart.parse(incoming);

    t.matchSnapshot(result, 'parsed request should match snapshot');
    t.end();
});

tap.test('Parser() - Request contains only fields', async (t) => {
    const multipart = new MultipartParser({
        legalFields: ['foo', 'bar'],
        sink: new Sink(),
    });

    const formData = new FormData();
    formData.append('foo', 'value-foo');
    formData.append('bar', 'value-bar');

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    const incoming = new HttpIncoming(req, {
        version: '1.1.1',
        author: {},
        type: 'pkg',
        name: 'buz',
        org: 'biz',
    });

    formData.pipe(req);

    const result = await multipart.parse(incoming);

    t.matchSnapshot(result, 'parsed request should match snapshot');
    t.end();
});

tap.test('Parser() - Request is empty', async (t) => {
    const multipart = new MultipartParser({
        legalFields: ['foo', 'bar'],
        legalFiles: ['tgz', 'tar'],
        sink: new Sink(),
    });

    const formData = new FormData();

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    const incoming = new HttpIncoming(req, {
        version: '1.1.1',
        author: {},
        type: 'pkg',
        name: 'buz',
        org: 'biz',
    });

    formData.pipe(req);

    t.rejects(multipart.parse(incoming), new Error('Unexpected end of form'), 'should reject with orignal error');
    t.end();
});

tap.test('Parser() - Request contain illegal field name', async (t) => {
    const multipart = new MultipartParser({
        legalFields: ['foo', 'bar'],
        sink: new Sink(),
    });

    const formData = new FormData();
    formData.append('foo', 'value-foo');
    formData.append('xyz', 'value-xyz');

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    const incoming = new HttpIncoming(req, {
        version: '1.1.1',
        author: {},
        type: 'pkg',
        name: 'buz',
        org: 'biz',
    });

    formData.pipe(req);

    t.rejects(multipart.parse(incoming), new HttpError.BadRequest(), 'should reject with bad request error');
    t.end();
});

tap.test('Parser() - Request contain illegal field name', async (t) => {
    const multipart = new MultipartParser({
        legalFiles: ['tgz', 'tar'],
        sink: new Sink(),
    });

    const formData = new FormData();
    formData.append('tgz', fs.createReadStream(FIXTURE_GZ));
    formData.append('xyz', fs.createReadStream(FIXTURE_TAR));

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    const incoming = new HttpIncoming(req, {
        version: '1.1.1',
        author: {},
        type: 'pkg',
        name: 'buz',
        org: 'biz',
    });

    formData.pipe(req);

    t.rejects(multipart.parse(incoming), new HttpError.BadRequest(), 'should reject with bad request error');
    t.end();
});

tap.test('Parser() - Request contain unprocessable file', async (t) => {
    const multipart = new MultipartParser({
        legalFiles: ['file'],
        sink: new Sink(),
    });

    const formData = new FormData();
    formData.append('file', fs.createReadStream(FIXTURE_BZ2));

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    const incoming = new HttpIncoming(req, {
        version: '1.1.1',
        author: {},
        type: 'pkg',
        name: 'buz',
        org: 'biz',
    });

    formData.pipe(req);

    t.rejects(multipart.parse(incoming), new HttpError.UnprocessableEntity(), 'should reject with unprocessable entity error');
    t.end();
});

tap.test('Parser() - Request contain file which is too large', async (t) => {
    const multipart = new MultipartParser({
        pkgMaxFileSize: 1024,
        legalFiles: ['large', 'small'],
        sink: new Sink(),
    });

    const formData = new FormData();
    formData.append('small', fs.createReadStream(FIXTURE_GZ));
    formData.append('large', fs.createReadStream(FIXTURE_PKG));

    const headers = formData.getHeaders();
    const req = new Request({ headers });
    const incoming = new HttpIncoming(req, {
        version: '1.1.1',
        author: {},
        type: 'pkg',
        name: 'buz',
        org: 'biz',
    });

    formData.pipe(req);

    t.rejects(multipart.parse(incoming), new HttpError.PayloadTooLarge(), 'should reject with payload too large error');
    t.end();
});
