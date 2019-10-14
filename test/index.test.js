'use strict';

const supertest = require('supertest');
const { test } = require('tap');
debugger;
const app = require('../index');

test('publish with specified arguments', async t => {
    const { body } = await supertest(app)
        .post('/finn/js/react/16.8.6')
        .field('data', JSON.stringify({ subtype: 'default', file: 'main.js' }))
        .attach('file', 'test/fixtures/file.js');
    t.equal(body.success, true);
    t.equal(
        body.url,
        'http://localhost:4001/finn/js/react/16.8.6/default/main.js'
    );
    t.end();
});

test('publish', async t => {
    const { body } = await supertest(app)
        .post('/finn/js/react/16.8.6')
        .attach('file', 'test/fixtures/file.js');
    t.equal(body.success, true);
    t.equal(
        body.url,
        'http://localhost:4001/finn/js/react/16.8.6/esm/index.js'
    );
    t.end();
});

test('get published file with full path', async t => {
    const { text } = await supertest(app).get(
        '/finn/js/react/16.8.6/default/main.js'
    );
    t.equal(
        text,
        'Moved Permanently. Redirecting to https://asset-pipe-v3.storage.googleapis.com/finn/js/react/16.8.6/default/main.js'
    );
    t.end();
});

test('get published file with path defaults', async t => {
    const { text } = await supertest(app).get('/finn/js/react/16.8.6');
    t.equal(
        text,
        'Moved Permanently. Redirecting to https://asset-pipe-v3.storage.googleapis.com/finn/js/react/16.8.6/esm/index.js'
    );
    t.end();
});

test('put alias without optional parameters', async t => {
    const { body } = await supertest(app)
        .put('/a/finn/js/react/v16')
        .field('data', JSON.stringify({ version: '16.8.6' }));

    t.equal(body.success, true);
    t.equal(body.url, 'http://localhost:4001/a/finn/js/react/v16');
    t.end();
});

test('put alias with optional parameters', async t => {
    const { body } = await supertest(app)
        .put('/a/finn/js/react/v16-default')
        .field(
            'data',
            JSON.stringify({
                version: '16.8.6',
                subtype: 'default',
                file: 'main.js',
            })
        );

    t.equal(body.success, true);
    t.equal(body.url, 'http://localhost:4001/a/finn/js/react/v16-default');
    t.end();
});

test('get alias with path defaults', async t => {
    const { text } = await supertest(app).get('/a/finn/js/react/v16');
    t.equal(
        text,
        'Found. Redirecting to https://asset-pipe-v3.storage.googleapis.com/finn/js/react/16.8.6/esm/index.js'
    );
    t.end();
});

test('get alias with set path values', async t => {
    const { text } = await supertest(app).get('/a/finn/js/react/v16-default');
    t.equal(
        text,
        'Found. Redirecting to https://asset-pipe-v3.storage.googleapis.com/finn/js/react/16.8.6/default/main.js'
    );
    t.end();
});

test('delete alias', async t => {
    const { body } = await supertest(app).delete(
        '/a/finn/js/react/v16-default'
    );
    t.equal(body.success, true);
    t.equal(body.url, 'http://localhost:4001/a/finn/js/react/v16-default');

    await supertest(app)
        .get('/a/finn/js/react/v16-default')
        .expect(404);

    t.end();
});

test('put import map value', async t => {
    const { body } = await supertest(app)
        .put('/import-map/finn/js/react')
        .field('data', JSON.stringify({ value: 'http://something.com' }));

    t.equal(body.success, true);
    t.equal(body.url, 'http://localhost:4001/import-map/finn/js');
    t.end();
});

test('get import map file', async t => {
    const { text } = await supertest(app).get('/import-map/finn/js');
    t.equal(
        text,
        'Moved Permanently. Redirecting to https://asset-pipe-v3.storage.googleapis.com/finn/js/import-map.json'
    );
    t.end();
});

test('delete import map value', async t => {
    const { body } = await supertest(app).delete('/import-map/finn/js/react');

    t.equal(body.success, true);
    t.equal(body.url, 'http://localhost:4001/import-map/finn/js');
    t.end();
});
