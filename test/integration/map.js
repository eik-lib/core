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

const FIXTURE_MAP = path.resolve(__dirname, '../../fixtures/import-map.json');

test('import-map - put map -> get map - scoped successfully uploaded', async (t) => {
    const sink = new Sink();
    const service = new Server({ customSink: sink, port: 0, logger: false });
    const address = await service.start();

    const formData = new FormData();
    formData.append('map', fs.createReadStream(FIXTURE_MAP));

    // PUT map on server
    const uploaded = await fetch(`${address}/biz/map/@cuz/buzz/4.2.2`, {
        method: 'PUT',
        body: formData,
        headers: formData.getHeaders(),
        redirect: 'manual',
    });

    t.equals(uploaded.status, 303, 'on PUT of map, server should respond with a 303 redirect');
    t.equals(uploaded.headers.get('location'), `${address}/biz/map/@cuz/buzz/4.2.2`, 'on PUT of map, server should respond with a location header');

    // GET map from server
    const downloaded = await fetch(`${address}/biz/map/@cuz/buzz/4.2.2`, {
        method: 'GET',
    });

    const downloadedResponse = await downloaded.json();

    t.equals(downloaded.status, 200, 'on GET of map, server should respond with 200 ok');
    t.matchSnapshot(downloadedResponse, 'on GET of map, response should match snapshot');

    await service.stop();
});

test('import-map - put map -> get map - non scoped successfully uploaded', async (t) => {
    const sink = new Sink();
    const service = new Server({ customSink: sink, port: 0, logger: false });
    const address = await service.start();

    const formData = new FormData();
    formData.append('map', fs.createReadStream(FIXTURE_MAP));

    // PUT map on server
    const uploaded = await fetch(`${address}/biz/map/buzz/4.2.2`, {
        method: 'PUT',
        body: formData,
        headers: formData.getHeaders(),
        redirect: 'manual',
    });

    t.equals(uploaded.status, 303, 'on PUT of map, server should respond with a 303 redirect');
    t.equals(uploaded.headers.get('location'), `${address}/biz/map/buzz/4.2.2`, 'on PUT of map, server should respond with a location header');

    // GET map from server
    const downloaded = await fetch(`${address}/biz/map/buzz/4.2.2`, {
        method: 'GET',
    });

    const downloadedResponse = await downloaded.json();

    t.equals(downloaded.status, 200, 'on GET of map, server should respond with 200 ok');
    t.matchSnapshot(downloadedResponse, 'on GET of map, response should match snapshot');

    await service.stop();
});

test('import-map - get map versions - scoped', async (t) => {
    const sink = new Sink();
    const service = new Server({ customSink: sink, port: 0, logger: false });
    const address = await service.start();

    // PUT map on server

    const formDataA = new FormData();
    formDataA.append('map', fs.createReadStream(FIXTURE_MAP));
    await fetch(`${address}/biz/map/@cuz/buzz/4.2.2`, {
        method: 'PUT',
        body: formDataA,
        headers: formDataA.getHeaders(),
        redirect: 'manual',
    });

    const formDataB = new FormData();
    formDataB.append('map', fs.createReadStream(FIXTURE_MAP));
    await fetch(`${address}/biz/map/@cuz/buzz/5.2.2`, {
        method: 'PUT',
        body: formDataB,
        headers: formDataB.getHeaders(),
        redirect: 'manual',
    });

    const formDataC = new FormData();
    formDataC.append('map', fs.createReadStream(FIXTURE_MAP));
    await fetch(`${address}/biz/map/@cuz/buzz/4.9.2`, {
        method: 'PUT',
        body: formDataC,
        headers: formDataC.getHeaders(),
        redirect: 'manual',
    });

    // GET map from server
    const downloaded = await fetch(`${address}/biz/map/@cuz/buzz`, {
        method: 'GET',
    });

    const downloadedResponse = await downloaded.json();

    t.equals(downloaded.status, 200, 'on GET of map versions, server should respond with 200 ok');
    t.matchSnapshot(downloadedResponse, 'on GET of map versions, response should match snapshot');

    await service.stop();
});

test('import-map - get map versions - non scoped', async (t) => {
    const sink = new Sink();
    const service = new Server({ customSink: sink, port: 0, logger: false });
    const address = await service.start();

    // PUT map on server

    const formDataA = new FormData();
    formDataA.append('map', fs.createReadStream(FIXTURE_MAP));
    await fetch(`${address}/biz/map/buzz/4.2.2`, {
        method: 'PUT',
        body: formDataA,
        headers: formDataA.getHeaders(),
        redirect: 'manual',
    });

    const formDataB = new FormData();
    formDataB.append('map', fs.createReadStream(FIXTURE_MAP));
    await fetch(`${address}/biz/map/buzz/5.2.2`, {
        method: 'PUT',
        body: formDataB,
        headers: formDataB.getHeaders(),
        redirect: 'manual',
    });

    const formDataC = new FormData();
    formDataC.append('map', fs.createReadStream(FIXTURE_MAP));
    await fetch(`${address}/biz/map/buzz/4.9.2`, {
        method: 'PUT',
        body: formDataC,
        headers: formDataC.getHeaders(),
        redirect: 'manual',
    });

    // GET map from server
    const downloaded = await fetch(`${address}/biz/map/buzz`, {
        method: 'GET',
    });

    const downloadedResponse = await downloaded.json();

    t.equals(downloaded.status, 200, 'on GET of map versions, server should respond with 200 ok');
    t.matchSnapshot(downloadedResponse, 'on GET of map versions, response should match snapshot');

    await service.stop();
});
