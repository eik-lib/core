'use strict';

const HttpIncoming = require('../../lib/classes/http-incoming');
const tap = require('tap');

//
// Constructor
//

tap.test('HttpIncoming() - object type - should be HttpIncoming', (t) => {
    const obj = new HttpIncoming();
    t.equal(Object.prototype.toString.call(obj), '[object HttpIncoming]');
    t.end();
});
