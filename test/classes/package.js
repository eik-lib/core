'use strict';

const { test } = require('tap');
const Package = require('../../lib/classes/package');

test('Package() - object type - should be Package', (t) => {
    const pkg = new Package();
    t.equal(Object.prototype.toString.call(pkg), '[object Package]');
    t.end();
});
