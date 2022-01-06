import path from 'node:path';
import globals from './globals.js';


// Build URL pathname to a package log file

const createURIPathToPkgLog = ({ type = '', name = '', version = '' } = {}) => path.join(globals.ROOT, type, name, version)


// Build URL pathname to an asset in a package

const createURIPathToAsset = ({ type = '', name = '', version = '', asset = '' } = {}) => path.join(globals.ROOT, type, name, version, asset)


// Build URL pathname to an import map

const createURIPathToImportMap = ({ name = '', version = '' } = {}) => path.join(globals.ROOT, globals.BASE_IMPORT_MAPS, name, version)


// Build URL pathname to an alias source

const createURIToAlias = ({ type = '', name = '', alias = '' } = {}) => path.join(globals.ROOT, type, name, `v${alias}`)


// Build URL pathname to an alias target destination

const createURIToTargetOfAlias = ({ type = '', name = '', version = '', extra = '' } = {}) => path.join(globals.ROOT, type, name, version, extra)

export {
    createURIPathToPkgLog,
    createURIPathToAsset,
    createURIPathToImportMap,
    createURIToAlias,
    createURIToTargetOfAlias,
}