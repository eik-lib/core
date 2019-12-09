'use strict';

const { test } = require('tap');
const HttpIncoming = require('../../lib/classes/http-incoming');

test('HttpIncoming() - Object type', (t) => {
    const obj = new HttpIncoming();
    t.equal(Object.prototype.toString.call(obj), '[object HttpIncoming]', 'should be HttpIncoming');
    t.end();
});

test('HttpIncoming() - Default property values', (t) => {
    const obj = new HttpIncoming();
    t.type(obj.request, 'undefined', '.request should be undefined');
    t.same(obj.headers, {}, '.headers should be empty Object');
    t.equal(obj.version, '', '.version should be empty String');
    t.equal(obj.extras, '', '.extras should be empty String');
    t.equal(obj.alias, '', '.alias should be empty String');
    t.equal(obj.type, '', '.type should be empty String');
    t.equal(obj.name, '', '.name should be empty String');
    t.equal(obj.org, '', '.org should be empty String');
    t.end();
});

test('HttpIncoming() - Set values to the arguments on the constructor', (t) => {
    const obj = new HttpIncoming({
        headers: {
            foo: 'bar'
        }
    }, {
        version: '1.0.0',
        extras: '/foo',
        alias: 'v1',
        name: 'buzz',
        type: 'pkg',
        org: 'bizz',
    });
    t.type(obj.request, 'object', '.request should contain value set on constructor');
    t.same(obj.headers, { foo: 'bar' }, '.headers should be the headers from the request argument');
    t.equal(obj.version, '1.0.0', '.version should contain value set on constructor');
    t.equal(obj.extras, '/foo', '.extras should contain value set on constructor');
    t.equal(obj.alias, 'v1', '.alias should contain value set on constructor');
    t.equal(obj.type, 'pkg', '.type should contain value set on constructor');
    t.equal(obj.name, 'buzz', '.name should contain value set on constructor');
    t.equal(obj.org, 'bizz', '.org should contain value set on constructor');
    t.end();
});
