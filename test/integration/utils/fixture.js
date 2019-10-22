'use strict';

const { tmpdir } = require('os');
const { join, dirname } = require('path');
const { writeFileSync } = require('fs');
const mkdirp = require('mkdirp');

function fixture({ org, name, version, extras, content = '' } = {}) {
    const fullPath = join(
        tmpdir(),
        'asset-pipe',
        org,
        'pkg',
        name,
        version,
        extras,
    );
    mkdirp.sync(dirname(fullPath));
    writeFileSync(fullPath, content);
}

module.exports = fixture;
