import tap from 'tap';
import Author from '../../lib/classes/author.js';

tap.test('Author() - Object type', (t) => {
    const obj = new Author();
    t.equal(Object.prototype.toString.call(obj), '[object Author]', 'should be Author');
    t.end();
});

tap.test('Author() - Default property values', (t) => {
    const obj = new Author();
    t.equal(obj.user, '', '.user should be empty String');
    t.equal(obj.name, '', '.name should be empty String');
    t.end();
});

tap.test('Author() - Set arguments on the constructor', (t) => {
    const obj = new Author({ user: 'foo', name: 'bar' });
    t.equal(obj.user, 'foo', '.user should be the set value');
    t.equal(obj.name, 'bar', '.name should be the set value');
    t.end();
});

tap.test('Author() - Serialize object', (t) => {
    const obj = new Author({ user: 'foo', name: 'bar' });

    const o = JSON.parse(JSON.stringify(obj));

    t.equal(o.user, 'foo', '.user should be the set value');
    t.equal(o.name, 'bar', '.name should be the set value');
    t.end();
});