/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

'use strict';

const FormData = require('form-data');
const fetch = require('node-fetch');

const formData = new FormData();
formData.append('version', '8.8.9');

fetch('http://localhost:4001/biz/pkg/fuzz/v8', {
    method: 'POST',
    body: formData,
    headers: formData.getHeaders(),
})
.then(res => {
    let result = {};
    switch (res.status) {
        case 200:
            result = res.json();
            break;
        case 401:
            result = { status: res.status, message: 'Unauthorized' };
            break;
        case 404:
            result = { status: res.status, message: 'Not found' };
            break;
        case 502:
            result = { status: res.status, message: 'Writing file failed' };
            break;
        default:
            result = { status: res.status };
    }
    return result;
})
.then(obj => console.log(obj))
.catch(error => {
    console.log(error);
});
