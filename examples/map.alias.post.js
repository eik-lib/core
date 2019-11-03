/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

'use strict';

const FormData = require('form-data');
const fetch = require('node-fetch');

const formData = new FormData();
formData.append('version', '4.4.2');

fetch('http://localhost:4001/biz/map/buzz/v4', {
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
            case 404:
                result = { status: res.status, message: 'Not found' };
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
