/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

import FormData from 'form-data';
import fetch from 'node-fetch';

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

const put = async (address) => {
    const auth = await authenticate(address);

    const formData = new FormData();
    formData.append('version', '1.2.1');

    const headers = {'Authorization': `Bearer ${auth.token}`, ...formData.getHeaders()};

    const res = await fetch(`${address}/npm/lit-html/v1`, {
        method: 'PUT',
        body: formData,
        headers,
    })

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
    console.log(result);
}

put('http://localhost:4001');
