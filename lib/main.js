'use strict';

const VersionsGet = require('./handlers/versions.get');
const AliasPost = require('./handlers/alias.post');
const AliasPut = require('./handlers/alias.put');
const AliasGet = require('./handlers/alias.get');
const AliasDel = require('./handlers/alias.delete');
const AuthPost = require('./handlers/auth.post');
const PkgLog = require('./handlers/pkg.log');
const PkgGet = require('./handlers/pkg.get');
const PkgPut = require('./handlers/pkg.put');
const MapGet = require('./handlers/map.get');
const MapPut = require('./handlers/map.put');

const MEM = require('./sinks/mem');
const FS = require('./sinks/fs');

const globals = require('./utils/globals');

module.exports.http = {
    VersionsGet,
    AliasPost,
    AliasPut,
    AliasGet,
    AliasDel,
    AuthPost,
    PkgLog,
    PkgGet,
    PkgPut,
    MapGet,
    MapPut,
};

module.exports.sink = {
    MEM,
    FS,
};

module.exports.prop = {
    base_auth: globals.BASE_AUTHENTICATION,
    base_map: globals.BASE_IMPORT_MAPS,
    base_pkg: globals.BASE_PACKAGES,
};
