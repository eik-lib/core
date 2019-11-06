'use strict';

const path = require('path');
const { BASE_IMPORT_MAPS, BASE_ASSETS, ROOT } = require('../utils/globals');


// Build file system path to a package log file

const pkgLog = ({ org = '', name = '', version = '' } = {}) => {
    return path.join(ROOT, org, BASE_ASSETS, name, `${version}.log.json`);
}
module.exports.pkgLog = pkgLog;


// Build file system path to an asset in a package

const pkgAsset = ({ org = '', name = '', version = '', extra = '' } = {}) => {
    return path.join(ROOT, org, BASE_ASSETS, name, version, extra);
}
module.exports.pkgAsset = pkgAsset;


// Build file system path to an import map

const map = ({ org = '', name = '', version = '' } = {}) => {
    return path.join(ROOT, org, BASE_IMPORT_MAPS, name, `${version}.json`);
}
module.exports.map = map;


// Build file system path to an alias file

const fsAlias = ({ org = '', type = '', name = '', alias = '' } = {}) => {
    return path.join(ROOT, org, type, name, `${alias}.alias.json`);
}
module.exports.alias = fsAlias;
