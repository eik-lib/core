'use strict';

const fetch = require('node-fetch');

fetch('http://localhost:4001/biz/map/buzz/4.2.2', {
    method: 'GET',
})
.then((res) => res.json())
.then(obj => console.log(obj));
