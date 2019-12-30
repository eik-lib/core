'use strict';

const path = require('path');

const sanitizeExtras = (extras, version) => {
    if (version && extras) {
        return path.join(version, extras);
    }
    return extras || '';
};
module.exports.sanitizeExtras = sanitizeExtras;

const sanitizeName = (scope, name) => {
    if (scope && name) {
        return path.join(scope, name);
    }
    return scope || '';
};
module.exports.sanitizeName = sanitizeName;

const sanitizeParameters = (type = '', params = {}) => {
    if (params.scope && params.scope.startsWith('@')) {
        return {
            version: params.version,
            extras: sanitizeExtras(params['*']),
            name: sanitizeName(params.scope, params.name),
            type,
            org: params.org,
        };
    }

    return {
        version: params.name,
        extras: sanitizeExtras(params['*'], params.version),
        name: sanitizeName(params.scope),
        type,
        org: params.org,
    };
};
module.exports.sanitizeParameters = sanitizeParameters;
