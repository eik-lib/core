'use strict';

const tap = require('tap');
const ImportMapEntry = require('../../lib/classes/import-map-entry');

//
// Constructor
//

tap.test('ImportMapEntry() - object type - should be ImportMapEntry', (t) => {
    const obj = new ImportMapEntry();
    t.equal(Object.prototype.toString.call(obj), '[object ImportMapEntry]');
    t.end();
});
