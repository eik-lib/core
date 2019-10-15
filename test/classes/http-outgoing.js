'use strict';

const tap = require('tap');
const HttpOutgoing = require('../../lib/classes/http-outgoing');

//
// Constructor
//

tap.test('HttpOutgoing() - object type - should be HttpOutgoing', (t) => {
    const obj = new HttpOutgoing();
    t.equal(Object.prototype.toString.call(obj), '[object HttpOutgoing]');
    t.end();
});
