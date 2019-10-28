/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

'use strict';

const fetch = require('node-fetch');

fetch('http://localhost:4001/biz/pkg/fuzz/8.4.1/main/index.js', {
    method: 'GET',
})
.then(res => res.text())
.then(body => console.log(body));
