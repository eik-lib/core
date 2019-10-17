'use strict';

const FormData = require('form-data');
const { Writable } = require('stream');
const fetch = require('node-fetch');
const fs = require('fs');

const formData = new FormData();
formData.append('filedata', fs.createReadStream('../fixtures/archive.tgz'));

fetch('http://localhost:4001/biz/pkg/fuzz/8.4.1', {
    method: 'PUT',
    body: formData
})
.then((res) => {
    const stream = new Writable({
        objectMode: false,
        write(chunk, encoding, callback) {
            console.log(JSON.parse(chunk.toString()));
            callback();
        },
    });
    res.body.pipe(stream);
});
