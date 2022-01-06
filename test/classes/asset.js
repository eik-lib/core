import tap from 'tap';
import Asset from '../../lib/classes/asset.js';

tap.test('HttpIncoming() - Object type', (t) => {
    const obj = new Asset();
    t.equal(Object.prototype.toString.call(obj), '[object Asset]', 'should be Asset');
    t.end();
});

tap.test('Asset() - Default property values', (t) => {
    const obj = new Asset();
    t.equal(obj.integrity, '', '.integrity should be empty String');
    t.equal(obj.pathname, '/', '.pathname should be "/"');
    t.equal(obj.mimeType, 'application/octet-stream', '.mimetype should be "application/octet-stream"');
    t.equal(obj.version, '', '.version should be empty String');
    t.equal(obj.asset, '/', '.asset should be "/"');
    t.equal(obj.name, '', '.name should be empty String');
    t.equal(obj.type, '', '.type should be empty String');
    t.equal(obj.size, -1, '.size should be the number -1');
    t.equal(obj.org, '', '.org should be empty String');
    t.end();
});

tap.test('Asset() - Set values to the arguments on the constructor', (t) => {
    const obj = new Asset({
        pathname: '/foo/bar.js',
        version: '4.2.6',
        name: 'buzz',
        type: 'pkg',
        org: 'bizz',
    });
    t.equal(obj.integrity, '', '.integrity should be empty String');
    t.equal(obj.pathname, '/foo/bar.js', '.pathname should contain value set on constructor');
    t.equal(obj.mimeType, 'application/javascript', '.mimeType should contain value matching type of file set on "pathname"');
    t.equal(obj.version, '4.2.6', '.version should contain value set on constructor');
    t.equal(obj.asset, '/foo/bar.js', '.asset should contain same value as set on "pathname" on constructor');
    t.equal(obj.name, 'buzz', '.name should contain value set on constructor');
    t.equal(obj.type, 'pkg', '.type should contain value set on constructor');
    t.equal(obj.size, -1, '.size should be the number -1');
    t.equal(obj.org, 'bizz', '.org should contain value set on constructor');
    t.end();
});

tap.test('Asset() - Set values to the argument "type" on the constructor in upper case', (t) => {
    const obj = new Asset({
        type: 'PkG',
    });
    t.equal(obj.type, 'pkg', '.type should contain value set on property in lower case');
    t.end();
});

tap.test('Asset() - Set .integrity property', (t) => {
    const obj = new Asset();
    obj.integrity = 'foo';
    t.equal(obj.integrity, 'foo', '.integrity should contain value set on property');
    t.end();
});

tap.test('Asset() - Set .type property', (t) => {
    const obj = new Asset();
    obj.type = 'pkg';
    t.equal(obj.type, 'pkg', '.type should contain value set on property');
    t.end();
});

tap.test('Asset() - Set .type property with upper case characthers', (t) => {
    const obj = new Asset();
    obj.type = 'PkG';
    t.equal(obj.type, 'pkg', '.type should contain value set on property in lower case');
    t.end();
});

tap.test('Asset() - Set .size property', (t) => {
    const obj = new Asset();
    obj.size = 1234;
    t.equal(obj.size, 1234, '.size should contain value set on property');
    t.end();
});

tap.test('Asset() - Stringify object to JSON', (t) => {
    const obj = new Asset({
        pathname: '/foo/bar.js',
        version: '4.2.6',
        name: 'buzz',
        type: 'pkg',
        org: 'bizz',
    });
    obj.integrity = 'foo';
    obj.size = 1234;

    const o = JSON.parse(JSON.stringify(obj));

    t.equal(o.integrity, 'foo', '.integrity should contain value set on origin object');
    t.equal(o.pathname, '/foo/bar.js', '.pathname should contain value set on origin object');
    t.equal(o.mimeType, 'application/javascript', '.mimeType should contain value matching type of file set on "pathname" on the origin object');
    t.equal(o.type, 'pkg', '.type should contain value set on origin object');
    t.equal(o.size, 1234, '.size should contain value set on origin object');
    t.end();
});
