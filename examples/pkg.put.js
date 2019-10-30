/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

'use strict';

const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');

const formData = new FormData();
formData.append('filedata', fs.createReadStream('../fixtures/archive.tgz'));

fetch('http://localhost:4001/biz/pkg/fuzz/8.4.1', {
    method: 'PUT',
    body: formData,
    headers: formData.getHeaders(),
})
.then(res => res.json())
.then(json => console.log(json));
