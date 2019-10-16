'use strict';

const tap = require('tap');
const ImportMap = require('../../lib/classes/import-map');

//
// Constructor
//

tap.test('ImportMap() - object type - should be ImportMap', (t) => {
    const obj = new ImportMap();
    t.equal(Object.prototype.toString.call(obj), '[object ImportMap]');
    t.end();
});
