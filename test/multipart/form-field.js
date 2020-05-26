'use strict';

const tap = require('tap');
const FormField = require('../../lib/multipart/form-field');

tap.test('FormField() - Object type', (t) => {
    const obj = new FormField();
    t.equal(Object.prototype.toString.call(obj), '[object FormField]', 'should be FormField');
    t.end();
});

tap.test('FormField() - Default constructor values', (t) => {
    const obj = new FormField();
    t.equal(obj.name, '', '.name should be empty String');
    t.equal(obj.value, '', '.value should be empty String');
    t.end();
});

tap.test('FormField() - Custom constructor values', (t) => {
    const obj = new FormField({ name: 'foo', value: 'bar' });
    t.equal(obj.name, 'foo', '.name should have value from constructor');
    t.equal(obj.value, 'bar', '.value should have value from constructor');
    t.end();
});

tap.test('FormField() - .toJSON', (t) => {
    const obj = new FormField({ name: 'foo', value: 'bar' });
    const o = JSON.parse(JSON.stringify(obj));
    t.strictSame(o, { name: 'foo', value: 'bar' }, 'should stringify object');
    t.end();
});
