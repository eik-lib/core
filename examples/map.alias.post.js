'use strict';

const FormData = require('form-data');
const fetch = require('node-fetch');

const formData = new FormData();
formData.append('version', '4.4.2');

fetch('http://localhost:4001/biz/map/buzz/v4', {
    method: 'POST',
    body: formData
})
.then((res) => res.json())
.then(obj => console.log(obj));
