/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

'use strict';

const fetch = require('node-fetch');

fetch('http://localhost:4001/biz/map/buzz/v4', {
    method: 'DELETE',
})
.then(res => {
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
    return result;
})
.then(obj => console.log(obj))
.catch(error => {
    console.log(error);
});
