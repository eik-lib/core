/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

'use strict';

const FormData = require('form-data');
const { test } = require('tap');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const Server = require('../../services/fastify');
const Sink = require('../../lib/sinks/test');

const FIXTURE_PKG = path.resolve(__dirname, '../../fixtures/archive.tgz');

test('packages - put pkg -> get file - scoped successfully uploaded', async (t) => {
    const sink = new Sink();
    const service = new Server({ customSink: sink, port: 0, logger: false });
    const address = await service.start();

    const formData = new FormData();
    formData.append('package', fs.createReadStream(FIXTURE_PKG));

    // PUT files on server
    const uploaded = await fetch(`${address}/biz/pkg/@cuz/fuzz/1.4.8`, {
        method: 'PUT',
        body: formData,
        headers: formData.getHeaders(),
        redirect: 'manual',
    });

    t.equals(uploaded.status, 303, 'on PUT of package, server should respond with a 303 redirect');
    t.equals(uploaded.headers.get('location'), `${address}/biz/pkg/@cuz/fuzz/1.4.8`, 'on PUT of package, server should respond with a location header');

    // GET file from server
    const downloaded = await fetch(`${address}/biz/pkg/@cuz/fuzz/1.4.8/main/index.js`, {
        method: 'GET',
    });
    const downloadedResponse = await downloaded.text();

    t.equals(downloaded.status, 200, 'on GET of file, server should respond with 200 ok');
    t.matchSnapshot(downloadedResponse, 'on GET of package, response should match snapshot');

    await service.stop();
});

test('packages - put pkg -> get file - non scoped successfully uploaded', async (t) => {
    const sink = new Sink();
    const service = new Server({ customSink: sink, port: 0, logger: false });
    const address = await service.start();

    const formData = new FormData();
    formData.append('package', fs.createReadStream(FIXTURE_PKG));

    // PUT files on server
    const uploaded = await fetch(`${address}/biz/pkg/fuzz/8.4.1`, {
        method: 'PUT',
        body: formData,
        headers: formData.getHeaders(),
        redirect: 'manual',
    });

    t.equals(uploaded.status, 303, 'on PUT of package, server should respond with a 303 redirect');
    t.equals(uploaded.headers.get('location'), `${address}/biz/pkg/fuzz/8.4.1`, 'on PUT of package, server should respond with a location header');

    // GET file from server
    const downloaded = await fetch(`${address}/biz/pkg/fuzz/8.4.1/main/index.js`, {
        method: 'GET',
    });
    const downloadedResponse = await downloaded.text();

    t.equals(downloaded.status, 200, 'on GET of file, server should respond with 200 ok');
    t.matchSnapshot(downloadedResponse, 'on GET of package, response should match snapshot');

    await service.stop();
});

test('packages - get package overview - scoped', async (t) => {
    const sink = new Sink();
    const service = new Server({ customSink: sink, port: 0, logger: false });
    const address = await service.start();

    const formData = new FormData();
    formData.append('package', fs.createReadStream(FIXTURE_PKG));

    // PUT files on server
    const uploaded = await fetch(`${address}/biz/pkg/@cuz/fuzz/8.4.1/`, {
        method: 'PUT',
        body: formData,
        headers: formData.getHeaders(),
        redirect: 'manual',
    });

    t.equals(uploaded.status, 303, 'on PUT of package, server should respond with a 303 redirect');
    t.equals(uploaded.headers.get('location'), `${address}/biz/pkg/@cuz/fuzz/8.4.1`, 'on PUT of package, server should respond with a location header');

    // GET package overview from server
    const downloaded = await fetch(`${address}/biz/pkg/@cuz/fuzz/8.4.1/`, {
        method: 'GET',
    });
    const downloadedResponse = await downloaded.json();

    t.equals(downloaded.status, 200, 'on GET, server should respond with 200 ok');
    t.matchSnapshot(downloadedResponse, 'on GET, response should match snapshot');

    await service.stop();
});

test('packages - get package overview - non scoped', async (t) => {
    const sink = new Sink();
    const service = new Server({ customSink: sink, port: 0, logger: false });
    const address = await service.start();

    const formData = new FormData();
    formData.append('package', fs.createReadStream(FIXTURE_PKG));

    // PUT files on server
    const uploaded = await fetch(`${address}/biz/pkg/fuzz/8.4.1/`, {
        method: 'PUT',
        body: formData,
        headers: formData.getHeaders(),
        redirect: 'manual',
    });

    t.equals(uploaded.status, 303, 'on PUT of package, server should respond with a 303 redirect');
    t.equals(uploaded.headers.get('location'), `${address}/biz/pkg/fuzz/8.4.1`, 'on PUT of package, server should respond with a location header');

    // GET package overview from server
    const downloaded = await fetch(`${address}/biz/pkg/fuzz/8.4.1/`, {
        method: 'GET',
    });
    const downloadedResponse = await downloaded.json();

    t.equals(downloaded.status, 200, 'on GET, server should respond with 200 ok');
    t.matchSnapshot(downloadedResponse, 'on GET, response should match snapshot');

    await service.stop();
});

test('packages - get package overview - scoped', async (t) => {
    const sink = new Sink();
    const service = new Server({ customSink: sink, port: 0, logger: false });
    const address = await service.start();

    // PUT files on server

    const formDataA = new FormData();
    formDataA.append('package', fs.createReadStream(FIXTURE_PKG));
    await fetch(`${address}/biz/pkg/@cuz/fuzz/7.3.2/`, {
        method: 'PUT',
        body: formDataA,
        headers: formDataA.getHeaders(),
        redirect: 'manual',
    });

    const formDataB = new FormData();
    formDataB.append('package', fs.createReadStream(FIXTURE_PKG));
    await fetch(`${address}/biz/pkg/@cuz/fuzz/8.4.1/`, {
        method: 'PUT',
        body: formDataB,
        headers: formDataB.getHeaders(),
        redirect: 'manual',
    });

    const formDataC = new FormData();
    formDataC.append('package', fs.createReadStream(FIXTURE_PKG));
    await fetch(`${address}/biz/pkg/@cuz/fuzz/8.5.1/`, {
        method: 'PUT',
        body: formDataC,
        headers: formDataC.getHeaders(),
        redirect: 'manual',
    });

    // GET version overview from server
    const downloaded = await fetch(`${address}/biz/pkg/@cuz/fuzz/`, {
        method: 'GET',
    });
    const downloadedResponse = await downloaded.json();

    t.equals(downloaded.status, 200, 'on GET, server should respond with 200 ok');
    t.matchSnapshot(downloadedResponse, 'on GET, response should match snapshot');

    await service.stop();
});

test('packages - get package overview - non scoped', async (t) => {
    const sink = new Sink();
    const service = new Server({ customSink: sink, port: 0, logger: false });
    const address = await service.start();

    // PUT files on server

    const formDataA = new FormData();
    formDataA.append('package', fs.createReadStream(FIXTURE_PKG));
    await fetch(`${address}/biz/pkg/fuzz/7.3.2/`, {
        method: 'PUT',
        body: formDataA,
        headers: formDataA.getHeaders(),
        redirect: 'manual',
    });

    const formDataB = new FormData();
    formDataB.append('package', fs.createReadStream(FIXTURE_PKG));
    await fetch(`${address}/biz/pkg/fuzz/8.4.1/`, {
        method: 'PUT',
        body: formDataB,
        headers: formDataB.getHeaders(),
        redirect: 'manual',
    });

    const formDataC = new FormData();
    formDataC.append('package', fs.createReadStream(FIXTURE_PKG));
    await fetch(`${address}/biz/pkg/fuzz/8.5.1/`, {
        method: 'PUT',
        body: formDataC,
        headers: formDataC.getHeaders(),
        redirect: 'manual',
    });

    // GET version overview from server
    const downloaded = await fetch(`${address}/biz/pkg/fuzz/`, {
        method: 'GET',
    });
    const downloadedResponse = await downloaded.json();

    t.equals(downloaded.status, 200, 'on GET, server should respond with 200 ok');
    t.matchSnapshot(downloadedResponse, 'on GET, response should match snapshot');

    await service.stop();
});
