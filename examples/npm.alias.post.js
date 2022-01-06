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

const post = async (address) => {
    const auth = await authenticate(address);

    const formData = new FormData();
    formData.append('version', '8.8.9');

    const headers = {'Authorization': `Bearer ${auth.token}`, ...formData.getHeaders()};

    const res = await fetch(`${address}/npm/fuzz/v8`, {
        method: 'POST',
        body: formData,
        headers,
    })

    let result = {};
    switch (res.status) {
        case 200:
            result = await res.json();
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

post('http://localhost:4001');
