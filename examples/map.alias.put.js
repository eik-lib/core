/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

'use strict';

const FormData = require('form-data');
const fetch = require('node-fetch');

const formData = new FormData();
formData.append('version', '4.2.2');

fetch('http://localhost:4001/biz/map/buzz/v4', {
    method: 'PUT',
    body: formData,
})
    .then(res => res.json())
    .then(obj => console.log(obj));
