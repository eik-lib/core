'use strict';

const tap = require('tap');
const FormFile = require('../../lib/multipart/form-file');

tap.test('FormFile() - Object type', (t) => {
    const obj = new FormFile();
    t.equal(Object.prototype.toString.call(obj), '[object FormFile]', 'should be FormFile');
    t.end();
});

tap.test('FormFile() - Default constructor values', (t) => {
    const obj = new FormFile();
    t.equal(obj.name, '', '.name should be empty String');
    t.strictSame(obj.value, [], '.value should be empty Array');
    t.end();
});

tap.test('FormFile() - Custom constructor values', (t) => {
    const obj = new FormFile({ name: 'foo', value: ['bar'] });
    t.equal(obj.name, 'foo', '.name should have value from constructor');
    t.strictSame(obj.value, ['bar'], '.value should have value from constructor');
    t.end();
});

tap.test('FormFile() - Constructor value is illegal', (t) => {
    t.throws(() => {
        // eslint-disable-next-line no-unused-vars
        const obj = new FormFile({ name: 'foo', value: 'bar' });
    }, /The argument "value" must be of type Array/, 'Should throw');
    t.end();
});

tap.test('FormFile() - .toJSON', (t) => {
    const obj = new FormFile({ name: 'foo', value: ['bar'] });
    const o = JSON.parse(JSON.stringify(obj));
    t.strictSame(o, { name: 'foo', value: ['bar'] }, 'should stringify object');
    t.end();
});
