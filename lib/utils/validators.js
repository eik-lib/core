'use strict';

const httpError = require('http-errors');
const semver = require('semver');
const npmPkg = require('validate-npm-package-name');

const org = (value) => {
    if (/^[a-zA-Z0-9_-]+$/.test(value)) {
        return value.toLowerCase();
    }
    throw new httpError(400, 'The URL parameter "org" is not valid');
}
module.exports.org = org;


const name = (value) => {
    const result = npmPkg(value);
    if (result.validForNewPackages || result.validForOldPackages) {
        return value;
    }
    throw new httpError(400, 'The URL parameter "name" is not valid');
}
module.exports.name = name;


const version = (value) => {
    const result = semver.valid(value);
    if (result) {
        return result;
    }
    throw new httpError(400, 'The URL parameter "version" is not valid');
}
module.exports.version = version;


const alias = (value) => {
    if (/^[0-9]+$/.test(value)) {
        return value;
    }
    throw new httpError(400, 'The URL parameter "alias" is not valid');
}
module.exports.alias = alias;
