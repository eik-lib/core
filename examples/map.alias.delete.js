/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

'use strict';

const FormData = require('form-data');
const fetch = require('node-fetch');

const authenticate = async (address) => {
    const formData = new FormData();
    formData.append('key', 'change_me');

    const res = await fetch(`${address}/auth/login`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
    });

    return res.json();
}

const del = async (address) => {
    const auth = await authenticate(address);

    const headers = {
        'Authorization': `Bearer ${auth.token}`
    };

    const res = await fetch(`${address}/map/buzz/v4`, {
        method: 'DELETE',
        headers,
    })

    let result = {};
    switch (res.status) {
        case 204:
            result = { status: res.status, message: 'Deleted' };
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
    console.log(result);
}

del('http://localhost:4001');
