import tap from 'tap';
import Versions from '../../lib/classes/versions.js';

tap.test('Versions() - Object type', (t) => {
    const obj = new Versions();
    t.equal(Object.prototype.toString.call(obj), '[object Versions]', 'should be Versions');
    t.end();
});

tap.test('Versions() - Default property values', (t) => {
    const obj = new Versions();
    t.strictSame(obj.versions, [], '.version should be empty Array');
    t.equal(obj.name, '', '.name should be empty String');
    t.equal(obj.org, '', '.org should be empty String');
    t.end();
});

tap.test('Versions() - Set a value on the "name" argument on the constructor', (t) => {
    const obj = new Versions({ name: 'foo' });
    t.equal(obj.name, 'foo', '.name should be value set on constructor');
    t.end();
});

tap.test('Versions() - Set a value on the "name" argument on the constructor', (t) => {
    const obj = new Versions({ org: 'bar' });
    t.equal(obj.org, 'bar', '.org should be value set on constructor');
    t.end();
});

tap.test('Versions() - Set the multiple versions in the same major range', (t) => {
    const obj = new Versions();
    obj.setVersion('4.3.2', 'bar');
    obj.setVersion('4.6.1', 'foo');
    t.strictSame(obj.versions, [
        [4, { integrity: 'foo', version: '4.6.1' }]
    ], '.versions should have only one major version');
    t.end();
});

tap.test('Versions() - Set multiple versions with different major range', (t) => {
    const obj = new Versions();
    obj.setVersion('1.7.3', 'rab');
    obj.setVersion('3.3.2', 'bar');
    obj.setVersion('4.6.1', 'foo');
    obj.setVersion('2.6.9', 'xyz');
    t.strictSame(obj.versions, [
        [4, { integrity: 'foo', version: '4.6.1' }],
        [3, { integrity: 'bar', version: '3.3.2' }],
        [2, { integrity: 'xyz', version: '2.6.9' }],
        [1, { integrity: 'rab', version: '1.7.3' }],
    ], '.versions should have multiple major version in sorted order');
    t.end();
});

tap.test('Version() - Set a version with lower semver version than latest', (t) => {
    t.plan(1);

    const obj = new Versions();
    obj.setVersion('3.3.2', 'bar');
    obj.setVersion('3.4.1', 'foo');

    t.throws(() => {
        obj.setVersion('3.2.1', 'xyz');
    }, /Semver version is lower than previous version/, 'Should throw');
    t.end();
});

tap.test('Versions() - Get a version', (t) => {
    const obj = new Versions();
    obj.setVersion('4.2.4', 'xyz');
    obj.setVersion('4.3.2', 'bar');
    obj.setVersion('3.6.1', 'foo');

    const v3 = obj.getVersion(3);
    const v4 = obj.getVersion(4);

    t.strictSame(v3, { integrity: 'foo', version: '3.6.1' }, 'should match values set by .setVersion()');
    t.strictSame(v4, { integrity: 'bar', version: '4.3.2' }, 'should match values set by .setVersion()');

    t.end();
});

tap.test('Versions() - Set values to the arguments on the constructor', (t) => {
    const obj = new Versions({ name: 'buzz', org: 'bizz' });
    obj.setVersion('1.7.3', 'rab');
    obj.setVersion('3.3.2', 'bar');
    obj.setVersion('4.6.1', 'foo');
    obj.setVersion('2.6.9', 'xyz');

    const serialized = JSON.parse(JSON.stringify(obj));
    const o = new Versions(serialized);

    t.equal(o.name, obj.name, '.name should be same as in original object');
    t.equal(o.org, obj.org, '.org should be same as in original object');

    t.strictSame(o.versions, [
        [4, { integrity: 'foo', version: '4.6.1' }],
        [3, { integrity: 'bar', version: '3.3.2' }],
        [2, { integrity: 'xyz', version: '2.6.9' }],
        [1, { integrity: 'rab', version: '1.7.3' }],
    ], '.versions should have multiple major version in sorted order');

    const v3 = o.getVersion(3);
    const v4 = o.getVersion(4);

    t.strictSame(v3, { integrity: 'bar', version: '3.3.2' }, 'should match values set by .setVersion() on the original object');
    t.strictSame(v4, { integrity: 'foo', version: '4.6.1' }, 'should match values set by .setVersion() on the original object');

    t.end();
});
