'use strict';

const { test } = require('tap');
const Author = require('../../lib/classes/author');

test('Author() - Object type', (t) => {
    const obj = new Author();
    t.equal(Object.prototype.toString.call(obj), '[object Author]', 'should be Author');
    t.end();
});

test('Author() - Default property values', (t) => {
    const obj = new Author();
    t.equal(obj.user, '', '.user should be empty String');
    t.equal(obj.name, '', '.name should be empty String');
    t.end();
});

test('Author() - Set arguments on the constructor', (t) => {
    const obj = new Author({ user: 'foo', name: 'bar' });
    t.equal(obj.user, 'foo', '.user should be the set value');
    t.equal(obj.name, 'bar', '.name should be the set value');
    t.end();
});

test('Author() - Serialize object', (t) => {
    const obj = new Author({ user: 'foo', name: 'bar' });

    const o = JSON.parse(JSON.stringify(obj));

    t.equal(o.user, 'foo', '.user should be the set value');
    t.equal(o.name, 'bar', '.name should be the set value');
    t.end();
});