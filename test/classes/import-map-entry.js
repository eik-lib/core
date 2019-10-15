'use strict';

const ImportMapEntry = require('../../lib/classes/import-map-entry');
const tap = require('tap');

//
// Constructor
//

tap.test('ImportMapEntry() - object type - should be ImportMapEntry', (t) => {
    const obj = new ImportMapEntry();
    t.equal(Object.prototype.toString.call(obj), '[object ImportMapEntry]');
    t.end();
});
