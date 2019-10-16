'use strict';

const tap = require('tap');
const UploadLog = require('../../lib/classes/upload-log');

//
// Constructor
//

tap.test('UploadLog() - object type - should be UploadLog', (t) => {
    const obj = new UploadLog();
    t.equal(Object.prototype.toString.call(obj), '[object UploadLog]');
    t.end();
});
