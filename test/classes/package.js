import tap from 'tap';
import Package from '../../lib/classes/package.js';

tap.test('Package() - object type - should be Package', (t) => {
    const pkg = new Package();
    t.equal(Object.prototype.toString.call(pkg), '[object Package]');
    t.end();
});
