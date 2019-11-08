'use strict';

const path = require('path');
const { BASE_IMPORT_MAPS, BASE_ASSETS, ROOT } = require('../utils/globals');


// Build URL pathname to a package log file

const createURIPathToPkgLog = ({ org = '', name = '', version = '' } = {}) => {
    return path.join(ROOT, org, BASE_ASSETS, name, version);
}
module.exports.createURIPathToPkgLog = createURIPathToPkgLog;


// Build URL pathname to an asset in a package

const createURIPathToAsset = ({ org = '', name = '', version = '', asset = '' } = {}) => {
    return path.join(ROOT, org, BASE_ASSETS, name, version, asset);
}
module.exports.createURIPathToAsset = createURIPathToAsset;


// Build URL pathname to an import map

const createURIPathToImportMap = ({ org = '', name = '', version = '' } = {}) => {
    return path.join(ROOT, org, BASE_IMPORT_MAPS, name, version);
}
module.exports.createURIPathToImportMap = createURIPathToImportMap;


// Build URL pathname to an alias source

const createURIToAlias = ({ org = '', type = '', name = '', alias = '' } = {}) => {
    return path.join(ROOT, org, type, name, `v${alias}`);
}
module.exports.createURIToAlias = createURIToAlias;


// Build URL pathname to an alias target destination

const createURIToTargetOfAlias = ({ org = '', type = '', name = '', version = '', extra = '' } = {}) => {
    return path.join(ROOT, org, type, name, version, extra);
}
module.exports.createURIToTargetOfAlias = createURIToTargetOfAlias;

