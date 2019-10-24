'use strict';

const aliasPost = require('./handlers/alias.post');
const aliasPut = require('./handlers/alias.put');
const aliasGet = require('./handlers/alias.get');
const aliasDel = require('./handlers/alias.delete');
const pkgGet = require('./handlers/pkg.get');
const pkgPut = require('./handlers/pkg.put');
const mapPut = require('./handlers/map.put');
const mapGet = require('./handlers/map.get');

const MEM = require('./sinks/mem');
const GCS = require('./sinks/gcs');
const FS = require('./sinks/fs');

const globals = require('./utils/globals');

module.exports.http = {
    aliasPost,
    aliasPut,
    aliasGet,
    aliasDel,
    pkgGet,
    pkgPut,
    mapPut,
    mapGet,
};

module.exports.sink = {
    MEM,
    GCS,
    FS,
};

module.exports.prop = {
    base_map: globals.BASE_IMPORT_MAPS,
    base_pkg: globals.BASE_ASSETS,
};
