'use strict';

const { Readable } = require('stream');
const { test } = require('tap');
const ReadFile = require('../../lib/classes/read-file');

test('ReadFile() - Object type', (t) => {
    const obj = new ReadFile();
    t.equal(Object.prototype.toString.call(obj), '[object ReadFile]', 'should be ReadFile');
    t.end();
});

test('ReadFile() - Default property values', (t) => {
    const obj = new ReadFile();
    t.equal(obj.stream, undefined, '.stream should be "undefined"');
    t.equal(obj.etag, '', '.etag should be empty String');
    t.end();
});

test('ReadFile() - Set a value on the etag argument on the constructor', (t) => {
    const obj = new ReadFile({ etag: 'foo' });
    t.equal(obj.etag, 'foo', '.etag should be value set on constructor');
    t.end();
});

test('ReadFile() - Set a Readable stream as value on the .stream property', (t) => {
    const obj = new ReadFile();
    obj.stream = new Readable();
    t.true(obj.stream instanceof Readable, '.stream should be value set on .stream');
    t.end();
});

test('ReadFile() - Set a non Readable stream as value on the .stream property', (t) => {
    t.plan(1);
    t.throws(() => {
        const obj = new ReadFile();
        obj.stream = 'foo';
    }, /Value is not a Readable stream/, 'Should throw');
    t.end();
});
