'use strict';

const path = require('path');
const os = require('os');

const config = {
    pkgMaxFileSize: 10000000,
    mapMaxFileSize: 1000000,
    sinkFsRootPath: path.join(os.tmpdir(), '/eik-files'),
};
module.exports = config;
