/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

'use strict';

const FormData = require('form-data');
const { Writable } = require('stream');
const fetch = require('node-fetch');
const fs = require('fs');

const formData = new FormData();
formData.append('map', fs.createReadStream('../fixtures/import-map.json'));

fetch('http://localhost:4001/biz/map/buzz/4.2.2', {
    method: 'PUT',
    body: formData,
}).then(res => {
    const stream = new Writable({
        objectMode: false,
        write(chunk, encoding, callback) {
            console.log(JSON.parse(chunk.toString()));
            callback();
        },
    });
    res.body.pipe(stream);
});
