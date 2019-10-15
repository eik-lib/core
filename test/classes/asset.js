'use strict';

const Asset = require('../../lib/classes/asset');
const tap = require('tap');

//
// Constructor
//

tap.test('Asset() - object type - should be Asset', (t) => {
    const obj = new Asset();
    t.equal(Object.prototype.toString.call(obj), '[object Asset]');
    t.end();
});
