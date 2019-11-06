'use strict';

const path = require('path');
const { BASE_ASSETS, ROOT } = require('../utils/globals');

const pkgLog = ({ org = '', name = '', version = '' } = {}) => {
    return path.join(ROOT, org, BASE_ASSETS, name, `${version}.log.json`);
}
module.exports.pkgLog = pkgLog;
