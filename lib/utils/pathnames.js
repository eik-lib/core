'use strict';

const path = require('path');
const { BASE_IMPORT_MAPS, BASE_ASSETS, ROOT } = require('../utils/globals');


// Build URL pathname to a package log file

const pkgLog = ({ org = '', name = '', version = '' } = {}) => {
    return path.join(ROOT, org, BASE_ASSETS, name, version);
}
module.exports.pkgLog = pkgLog;


// Build URL pathname to an asset in a package

const pkgAsset = ({ org = '', name = '', version = '', extra = '' } = {}) => {
    return path.join(ROOT, org, BASE_ASSETS, name, version, extra);
}
module.exports.pkgAsset = pkgAsset;


// Build URL pathname to an import map

const map = ({ org = '', name = '', version = '' } = {}) => {
    return path.join(ROOT, org, BASE_IMPORT_MAPS, name, version);
}
module.exports.map = map;


// Build URL pathname to an alias source

const aliasSource = ({ org = '', type = '', name = '', alias = '' } = {}) => {
    return path.join(ROOT, org, type, name, `v${alias}`);
}
module.exports.aliasSource = aliasSource;


// Build URL pathname to an alias target destination

const aliasTarget = ({ org = '', type = '', name = '', version = '', extra = '' } = {}) => {
    return path.join(ROOT, org, type, name, version, extra);
}
module.exports.aliasTarget = aliasTarget;

