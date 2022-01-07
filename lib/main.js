import VersionsGet from './handlers/versions.get.js';
import AliasPost from './handlers/alias.post.js';
import AliasPut from './handlers/alias.put.js';
import AliasGet from './handlers/alias.get.js';
import AliasDel from './handlers/alias.delete.js';
import AuthPost from './handlers/auth.post.js';
import PkgLog from './handlers/pkg.log.js';
import PkgGet from './handlers/pkg.get.js';
import PkgPut from './handlers/pkg.put.js';
import MapGet from './handlers/map.get.js';
import MapPut from './handlers/map.put.js';

import TEST from './sinks/test.js';
import MEM from './sinks/mem.js';
import FS from './sinks/fs.js';

import HealthCheck from './utils/healthcheck.js';
import globals from './utils/globals.js';

const http = {
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

const sink = {
    TEST,
    MEM,
    FS,
};

const prop = {
    base_auth: globals.BASE_AUTHENTICATION,
    base_map: globals.BASE_IMPORT_MAPS,
    base_pkg: globals.BASE_PACKAGES,
    base_npm: globals.BASE_NPM,
};

export default {
    HealthCheck,
    http,
    sink,
    prop,
}