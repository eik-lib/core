'use strict';

const HttpOutgoing = require('../../lib/classes/http-outgoing');
const tap = require('tap');

//
// Constructor
//

tap.test('HttpOutgoing() - object type - should be HttpOutgoing', (t) => {
    const obj = new HttpOutgoing();
    t.equal(Object.prototype.toString.call(obj), '[object HttpOutgoing]');
    t.end();
});
