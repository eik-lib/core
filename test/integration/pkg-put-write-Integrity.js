'use strict';

const { createReadStream } = require('fs');
const FormData = require('form-data');
const { test } = require('tap');
const { join } = require('path');
const fetch = require('node-fetch');
const FastifyService = require('../../services/fastify');
const Sink = require('../../fixtures/sink-test');

test('Writing to sink is slow and irregular', async t => {
    const sink = new Sink();

    // Simulate a slow write process by delaying each chunk written
    // to the sink with something between 10 and 100 + (buffer count) ms.
    sink.delayWrite = (count) => {
        const max = 100 + count;
        const min = 10;
        return Math.floor(Math.random() * max) + min;
    };

    const service = new FastifyService({ customSink: sink, logger: false, port: 0 });
    const address = await service.start();

    const formData = new FormData();
    formData.append(
        'filedata',
        createReadStream(join(__dirname, '../../fixtures/archive.tgz')),
    );

    const res = await fetch(`${address}/biz/pkg/frazz/2.1.4`, {
        method: 'PUT',
        body: formData,
        headers: formData.getHeaders(),
    });

    const obj = await res.json();

    t.equals(obj.files.length, 7, 'Response should have 7 items in "files" Array');

    t.equal(
        obj.files[0].pathname,
        '/biz/pkg/frazz/2.1.4/main/index.js',
        'JavaScript file pathname should match',
    );

    t.equal(
        obj.files[0].mimeType,
        'application/javascript',
        'JavaScript file mime should match',
    );

    t.equal(
        obj.files[1].pathname,
        '/biz/pkg/frazz/2.1.4/main/index.js.map',
        'JavaScript file source map pathname should match',
    );
    t.equal(
        obj.files[1].mimeType,
        'application/json',
        'JavaScript file source map mime should match',
    );

    t.equal(
        obj.files[2].pathname,
        '/biz/pkg/frazz/2.1.4/ie11/index.js',
        'ie11 fallback bundle pathname should match',
    );
    t.equal(
        obj.files[2].mimeType,
        'application/javascript',
        'ie11 fallback bundle mime should match',
    );

    t.equal(
        obj.files[3].pathname,
        '/biz/pkg/frazz/2.1.4/ie11/index.js.map',
        'ie11 fallback bundle source map pathname should match',
    );
    t.equal(
        obj.files[3].mimeType,
        'application/json',
        'ie11 fallback bundle source map mime should match',
    );

    t.equal(
        obj.files[4].pathname,
        '/biz/pkg/frazz/2.1.4/main/index.css',
        'css file pathname should match',
    );
    t.equal(obj.files[4].mimeType, 'text/css', 'css file mime should match');

    t.equal(
        obj.files[5].pathname,
        '/biz/pkg/frazz/2.1.4/main/index.css.map',
        'css file source map pathname should match',
    );
    t.equal(
        obj.files[5].mimeType,
        'application/json',
        'css file source map mime should match',
    );

    t.equal(
        obj.files[6].pathname,
        '/biz/pkg/frazz/2.1.4/assets.json',
        'assets.json pathname should match',
    );
    t.equal(
        obj.files[6].mimeType,
        'application/json',
        'assets.json mime should match',
    );

    await service.stop();
});
