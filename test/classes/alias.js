'use strict';

const tap = require('tap');
const Alias = require('../../lib/classes/alias');

//
// Constructor
//

tap.test('Alias() - object type - should be Alias', (t) => {
    const obj = new Alias();
    t.equal(Object.prototype.toString.call(obj), '[object Alias]');
    t.end();
});
