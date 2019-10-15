'use strict';

const Alias = require('../../lib/classes/alias');
const tap = require('tap');

//
// Constructor
//

tap.test('Alias() - object type - should be Alias', (t) => {
    const obj = new Alias();
    t.equal(Object.prototype.toString.call(obj), '[object Alias]');
    t.end();
});
