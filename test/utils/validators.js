'use strict';

const httpError = require('http-errors');
const tap = require('tap');
const validators = require('../../lib/utils/validators');

//
// .org()
//

tap.test('.org() - valid values - should return value', (t) => {
    t.equal(validators.org('someorg'), 'someorg');
    t.equal(validators.org('some-org'), 'some-org');
    t.equal(validators.org('some_org'), 'some_org');
    t.equal(validators.org('123'), '123');
    t.end();
});

tap.test('.org() - invalid values - should throw', (t) => {
    t.throws(() => {
        validators.org('!name');
    }, new httpError(400, 'The URL parameter "org" is not valid'));
    t.end();
});

tap.test('.org() - upper case valid value - should convert to lower case value', (t) => {
    t.equal(validators.org('SOMEorg'), 'someorg');
    t.equal(validators.org('some-ORG'), 'some-org');
    t.equal(validators.org('SOME_ORG'), 'some_org');
    t.equal(validators.org('123'), '123');
    t.end();
});


//
// .name()
//

tap.test('.name() - valid values - should return value', (t) => {
    t.equal(validators.name('some-package'), 'some-package');
    t.equal(validators.name('example.com'), 'example.com');
    t.equal(validators.name('under_score'), 'under_score');
    t.equal(validators.name('123numeric'), '123numeric');
    t.equal(validators.name('@npm/thingy'), '@npm/thingy');
    t.equal(validators.name('@jane/foo.js'), '@jane/foo.js');
    t.end();
});

tap.test('.name() - invalid values - should throw', (t) => {
    t.throws(() => {
        validators.name(' leading-space:and:weirdchars');
    }, new httpError(400, 'The URL parameter "name" is not valid'));
    t.end();
});


//
// .version()
//

tap.test('.version() - valid values - should return value', (t) => {
    t.equal(validators.version('2.3.4'), '2.3.4');
    t.equal(validators.version('1.2.4-beta.0'), '1.2.4-beta.0');
    t.end();
});

tap.test('.version() - invalid values - should throw', (t) => {
    t.throws(() => {
        validators.version(' 1.and:weirdchars~5');
    }, new httpError(400, 'The URL parameter "version" is not valid'));
    t.end();
});

tap.test('.version() - caret range - should throw', (t) => {
    t.throws(() => {
        validators.version('^1.2.4');
    }, new httpError(400, 'The URL parameter "version" is not valid'));
    t.end();
});

tap.test('.version() - tilde range - should throw', (t) => {
    t.throws(() => {
        validators.version('~1.2.4');
    }, new httpError(400, 'The URL parameter "version" is not valid'));
    t.end();
});

tap.test('.version() - X-range - should throw', (t) => {
    t.throws(() => {
        validators.version('1.x');
    }, new httpError(400, 'The URL parameter "version" is not valid'));
    t.end();
});

tap.test('.version() - * - should throw', (t) => {
    t.throws(() => {
        validators.version('*');
    }, new httpError(400, 'The URL parameter "version" is not valid'));
    t.end();
});

tap.test('.version() - latest - should throw', (t) => {
    t.throws(() => {
        validators.version('latest');
    }, new httpError(400, 'The URL parameter "version" is not valid'));
    t.end();
});


//
// .alias()
//

tap.test('.alias() - valid values - should return value', (t) => {
    t.equal(validators.alias('8'), '8');
    t.equal(validators.alias('10'), '10');
    t.equal(validators.alias('10893475983749384'), '10893475983749384');
    t.end();
});

tap.test('.name() - invalid value - semver patch - should throw', (t) => {
    t.throws(() => {
        validators.alias('1.2.4');
    }, new httpError(400, 'The URL parameter "alias" is not valid'));
    t.end();
});

tap.test('.name() - invalid value - semver minor - should throw', (t) => {
    t.throws(() => {
        validators.alias('1.2');
    }, new httpError(400, 'The URL parameter "alias" is not valid'));
    t.end();
});

tap.test('.name() - invalid value - semver latest - should throw', (t) => {
    t.throws(() => {
        validators.alias('latest');
    }, new httpError(400, 'The URL parameter "alias" is not valid'));
    t.end();
});
