'use strict';

const tap = require('tap');
const utils = require('../../lib/utils/utils');

tap.test('utils.decodeUriComponent()', (t) => {
    t.equal(utils.decodeUriComponent('%40foo%2Fbar'), '@foo/bar', 'should decode URI encodings');
    t.equal(utils.decodeUriComponent('8%2E1%2E4%2D1'), '8.1.4-1', 'should decode URI encodings');	
    t.equal(utils.decodeUriComponent(undefined), undefined, 'should keep a undefined value as undefined');
    t.equal(utils.decodeUriComponent(undefined), undefined, 'should keep a null value as null');
    t.end();
});
