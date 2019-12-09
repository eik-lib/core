'use strict';

const path = require('path');
const { BASE_IMPORT_MAPS, BASE_ASSETS, ROOT } = require('../utils/globals');


// Build file system path to a package file

const createFilePathToPackage = ({ org = '', name = '', version = '' } = {}) => {
    return path.join(ROOT, org, BASE_ASSETS, name, `${version}.package.json`);
}
module.exports.createFilePathToPackage = createFilePathToPackage;


// Build file system path to an asset in a package
// pkgAsset
const createFilePathToAsset = ({ org = '', name = '', version = '', asset = '' } = {}) => {
    return path.join(ROOT, org, BASE_ASSETS, name, version, asset);
}
module.exports.createFilePathToAsset = createFilePathToAsset;


// Build file system path to an import map

const createFilePathToImportMap = ({ org = '', name = '', version = '' } = {}) => {
    return path.join(ROOT, org, BASE_IMPORT_MAPS, name, `${version}.import-map.json`);
}
module.exports.createFilePathToImportMap = createFilePathToImportMap;


// Build file system path to an alias file

const createFilePathToAlias = ({ org = '', type = '', name = '', alias = '' } = {}) => {
    return path.join(ROOT, org, type, name, `${alias}.alias.json`);
}
module.exports.createFilePathToAlias = createFilePathToAlias;


// Build file system path to an version file

const createFilePathToVersion = ({ org = '', type = '', name = '' } = {}) => {
    return path.join(ROOT, org, type, name, 'versions.json');
}
module.exports.createFilePathToVersion = createFilePathToVersion;