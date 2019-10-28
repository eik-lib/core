'use strict';

const semver = require('semver');
const npmPkg = require('validate-npm-package-name');

const org = value => {
    if (/^[a-zA-Z0-9_-]+$/.test(value)) {
        return value.toLowerCase();
    }
    throw new Error('Parameter "org" is not valid');
}
module.exports.org = org;

const name = value => {
    const result = npmPkg(value);
    if (result.validForNewPackages || result.validForOldPackages) {
        return value.toLowerCase();
    }
    throw new Error('Parameter "name" is not valid');
}
module.exports.name = name;

const version = value => {
    const result = semver.valid(value);
    if (result) {
        return result;
    }
    throw new Error('Parameter "version" is not valid');
}
module.exports.version = version;

const alias = value => {
    if (/^[0-9]+$/.test(value)) {
        return value;
    }
    throw new Error('Parameter "alias" is not valid');
}
module.exports.alias = alias;

const type = value => {
    if (value === 'pkg' || value === 'map') {
        return value;
    }
    throw new Error('Parameter "type" is not valid');
}
module.exports.type = type;

// TODO; https://github.com/asset-pipe/core/issues/12
const extra = (value) => {
    return value;
}
module.exports.extra = extra;
