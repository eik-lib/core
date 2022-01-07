/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

import fetch from 'node-fetch';

const get = async () => {

    const resA = await fetch('http://localhost:4001/map/buzz/4.2.2', {
        method: 'GET',
    });

    const textA = await resA.text()
    console.log('Request   I - ', 'Status code:', resA.status, 'ETag:', resA.headers.get('etag'), 'Content length:', textA.length);

    const resB = await fetch('http://localhost:4001/map/buzz/4.2.2', {
        method: 'GET',
        headers: {
            'If-None-Match': resA.headers.get('etag')
        }
    });

    const textB = await resB.text()
    console.log('Request  II - ', 'Status code:', resB.status, 'ETag:', resB.headers.get('etag'), 'Content length:', textB.length);

    const resC = await fetch('http://localhost:4001/map/buzz/4.2.2', {
        method: 'GET',
        headers: {
            'If-None-Match': resB.headers.get('etag')
        }
    });

    const textC = await resC.text()
    console.log('Request III - ', 'Status code:', resC.status, 'ETag:', resC.headers.get('etag'), 'Content length:', textC.length);
}
get();
