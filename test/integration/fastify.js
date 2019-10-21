'use strict';

const { test } = require('tap');
const fetch = require('node-fetch');
const FormData = require('form-data');
const { join } = require('path');
const { createReadStream } = require('fs');
const extractBody = require('./utils/extract-body');

test('Packages GET', async t => {
    const formData = new FormData();
    formData.append(
        'filedata',
        createReadStream(join(__dirname, '../../fixtures/archive.tgz')),
    );

    await fetch('http://localhost:4001/biz/pkg/fuzz/8.4.1', {
        method: 'PUT',
        body: formData,
        headers: formData.getHeaders(),
    });

    const res = await fetch(
        'http://localhost:4001/biz/pkg/fuzz/8.4.1/main/index.js',
    );
    const body = await res.text();
    t.equals(res.status, 200, 'server should respond with 200 ok');
    t.match(
        body,
        'hi there from the main file',
        'server should respond with file contents',
    );
});

test('Packages PUT - all files extracted, files accessible after upload', async t => {
    const formData = new FormData();
    formData.append(
        'filedata',
        createReadStream(join(__dirname, '../../fixtures/archive.tgz')),
    );

    const res = await fetch('http://localhost:4001/foo/pkg/bar/1.1.1', {
        method: 'PUT',
        body: formData,
        headers: formData.getHeaders(),
    });

    t.equals(res.status, 200, 'server PUT should respond with 200 ok');

    const file1 = await fetch(
        'http://localhost:4001/foo/pkg/bar/1.1.1/main/index.js',
    );
    const file2 = await fetch(
        'http://localhost:4001/foo/pkg/bar/1.1.1/main/index.js.map',
    );
    // const file3 = await fetch(
    //     'http://localhost:4001/foo/pkg/bar/1.1.1/ie11/index.js',
    // );
    // const file4 = await fetch(
    //     'http://localhost:4001/foo/pkg/bar/1.1.1/ie11/index.js.map',
    // );
    // const file5 = await fetch(
    //     'http://localhost:4001/foo/pkg/bar/1.1.1/main/index.css',
    // );
    // const file6 = await fetch(
    //     'http://localhost:4001/foo/pkg/bar/1.1.1/main/index.css.map',
    // );
    // const file7 = await fetch(
    //     'http://localhost:4001/foo/pkg/bar/1.1.1/assets.json',
    // );

    t.equals(file1.status, 200, 'GET to index.js responded with 200 ok');
    t.equals(file2.status, 200, 'GET to index.js.map responded with 200 ok');
    // t.equals(file3.status, 200, 'GET to ie11 index.js responded with 200 ok');
    // t.equals(
    //     file4.status,
    //     200,
    //     'GET to ie11 index.js.map responded with 200 ok',
    // );
    // t.equals(file5.status, 200, 'GET to index.css responded with 200 ok');
    // t.equals(file6.status, 200, 'GET to index.css.map responded with 200 ok');
    // t.equals(file7.status, 200, 'GET to assets.json responded with 200 ok');
});

test('Packages PUT - all files extracted, correct response received', async t => {
    const formData = new FormData();
    formData.append(
        'filedata',
        createReadStream(join(__dirname, '../../fixtures/archive.tgz')),
    );

    const res = await fetch('http://localhost:4001/biz/pkg/frazz/2.1.4', {
        method: 'PUT',
        body: formData,
        headers: formData.getHeaders(),
    });

    const buffer = await extractBody(res);

    t.equals(res.status, 200, 'server should respond with 200 ok');

    t.equal(
        buffer[0].pathname,
        '/biz/pkg/frazz/2.1.4/main/index.js',
        'JavaScript file pathname should match',
    );
    t.equal(
        buffer[0].mimeType,
        'application/javascript',
        'JavaScript file mime should match',
    );

    t.equal(
        buffer[1].pathname,
        '/biz/pkg/frazz/2.1.4/main/index.js.map',
        'JavaScript file source map pathname should match',
    );
    t.equal(
        buffer[1].mimeType,
        'application/json',
        'JavaScript file source map mime should match',
    );

    t.equal(
        buffer[2].pathname,
        '/biz/pkg/frazz/2.1.4/ie11/index.js',
        'ie11 fallback bundle pathname should match',
    );
    t.equal(
        buffer[2].mimeType,
        'application/javascript',
        'ie11 fallback bundle mime should match',
    );

    t.equal(
        buffer[3].pathname,
        '/biz/pkg/frazz/2.1.4/ie11/index.js.map',
        'ie11 fallback bundle source map pathname should match',
    );
    t.equal(
        buffer[3].mimeType,
        'application/json',
        'ie11 fallback bundle source map mime should match',
    );

    t.equal(
        buffer[4].pathname,
        '/biz/pkg/frazz/2.1.4/main/index.css',
        'css file pathname should match',
    );
    t.equal(buffer[4].mimeType, 'text/css', 'css file mime should match');

    t.equal(
        buffer[5].pathname,
        '/biz/pkg/frazz/2.1.4/main/index.css.map',
        'css file source map pathname should match',
    );
    t.equal(
        buffer[5].mimeType,
        'application/json',
        'css file source map mime should match',
    );

    t.equal(
        buffer[6].pathname,
        '/biz/pkg/frazz/2.1.4/assets.json',
        'assets.json pathname should match',
    );
    t.equal(
        buffer[6].mimeType,
        'application/json',
        'assets.json mime should match',
    );
});
