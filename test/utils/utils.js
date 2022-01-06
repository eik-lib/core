import tap from 'tap';
import { decodeUriComponent } from '../../lib/utils/utils.js';

tap.test('.decodeUriComponent()', (t) => {
    t.equal(decodeUriComponent('%40foo%2Fbar'), '@foo/bar', 'should decode URI encodings');
    t.equal(decodeUriComponent('8%2E1%2E4%2D1'), '8.1.4-1', 'should decode URI encodings');	
    t.equal(decodeUriComponent(undefined), undefined, 'should keep a undefined value as undefined');
    t.equal(decodeUriComponent(undefined), undefined, 'should keep a null value as null');
    t.end();
});
