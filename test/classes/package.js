'use strict';

const tap = require('tap');
const Package = require('../../lib/classes/package');

//
// Constructor
//

tap.test('Package() - object type - should be Package', (t) => {
    const pkg = new Package();
    t.equal(Object.prototype.toString.call(pkg), '[object Package]');
    t.end();
});
