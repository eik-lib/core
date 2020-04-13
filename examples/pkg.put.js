/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

'use strict';

const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');

const authenticate = async (address) => {
    const formData = new FormData();
    formData.append('key', 'change_me');

    const res = await fetch(`${address}/biz/auth/login`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
    });

    return res.json();
}

const put = async (address) => {
    const auth = await authenticate(address);

    const formData = new FormData();
    formData.append('package', fs.createReadStream('../fixtures/archive.tgz'));

    const headers = {'Authorization': `Bearer ${auth.token}`, ...formData.getHeaders()};

    const res = await fetch(`${address}/biz/pkg/fuzz/8.4.1`, {
        method: 'PUT',
        body: formData,
        headers,
    });

    let result = {};
    switch (res.status) {
        case 200:
            result = await res.json();
            break;
        case 400:
            result = { status: res.status, message: 'Invalid URL parameter' };
            break;
        case 401:
            result = { status: res.status, message: 'Unauthorized' };
            break;
        case 409:
            result = { status: res.status, message: 'Package exist' };
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
    console.log(result);
}

put('http://localhost:4001');
