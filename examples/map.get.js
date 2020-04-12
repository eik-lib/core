/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

'use strict';

const fetch = require('node-fetch');

fetch('http://localhost:4001/map/buzz/4.2.2', {
    method: 'GET',
})
    .then(res => res.json())
    .then(obj => console.log(obj))
    .catch(error => console.log(error));
