/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

'use strict';

const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');

const formData = new FormData();
formData.append('map', fs.createReadStream('../fixtures/import-map.json'));

fetch('http://localhost:4001/biz/map/buzz/4.2.2', {
    method: 'PUT',
    body: formData,
    headers: formData.getHeaders(),
})
.then(res => res.json())
.then(json => console.log(json))
.catch((err) => {
    console.log(err)
});
