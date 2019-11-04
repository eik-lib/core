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
    headers: formData.getHeaders(),
})
.then(res => {
    let result = {};
    switch (res.status) {
        case 200:
            result = res.json();
            break;
        case 400:
            result = { status: res.status, message: 'Invalid URL parameter' };
            break;
        case 401:
            result = { status: res.status, message: 'Unauthorized' };
            break;
        case 409:
            result = { status: res.status, message: 'Alias exist' };
            break;
        case 415:
            result = { status: res.status, message: 'Unsupported file format' };
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
