/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

'use strict';

const FormData = require('form-data');
const fetch = require('node-fetch');

const formData = new FormData();
formData.append('version', '8.4.1');

fetch('http://localhost:4001/biz/pkg/fuzz/v8', {
    method: 'PUT',
    body: formData,
})
    .then(res => res.json())
    .then(obj => console.log(obj));
