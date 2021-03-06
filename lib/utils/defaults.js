'use strict';

const path = require('path');
const os = require('os');

const config = {
    authKey: 'change_me',
    pkgMaxFileSize: 10000000,
    mapMaxFileSize: 1000000,
    sinkFsRootPath: path.join(os.tmpdir(), '/eik-files'),
    etag: true,
    organizations: [
        ['localhost', 'local'],
        ['127.0.0.1', 'local'],
    ],
};
module.exports = config;
