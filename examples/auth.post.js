/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

'use strict';

const FormData = require('form-data');
const fetch = require('node-fetch');

const authenticate = async (address) => {
    const formData = new FormData();
    formData.append('key', 'change_me');

    const res = await fetch(`${address}/biz/auth/login`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
    });

    const body = await res.json();

    console.log(body);
}

authenticate('http://localhost:4001');
