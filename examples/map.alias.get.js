/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

'use strict';

const fetch = require('node-fetch');

fetch('http://localhost:4001/map/buzz/v4', {
    method: 'GET',
})
    .then(res => res.json())
    .then(json => console.log(json));
