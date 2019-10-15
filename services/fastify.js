'use strict';

const fastify = require('fastify');
const {
    BASE_ALIAS,
    BASE_ASSETS,
    BASE_IMPORT_MAPS,
} = require('../lib/utils/globals');
const assetPost = require('../lib/handlers/asset.post');
const assetGet = require('../lib/handlers/asset.get');
const aliasPut = require('../lib/handlers/alias.put');
const aliasGet = require('../lib/handlers/alias.get');
const aliasDel = require('../lib/handlers/alias.delete');
const mapPut = require('../lib/handlers/import-map.put');
const mapGet = require('../lib/handlers/import-map.get');
const mapDel = require('../lib/handlers/import-map.delete');

const SinkFS = require('../lib/sinks/fs');
// const SinkGCS = require('../lib/sinks/gcs');

const sink = new SinkFS();
// const sink = new SinkGCS();

const app = fastify({
    logger: true,
});

const opts = {
    schema: {
        /*
        response: {
            200: {
                type: 'object',
                properties: {
                    hello: { type: 'string' }
                }
            }
        },
        */
        params: assetPost.params,
    },
};

const path = require('path');

const cred = path.join(__dirname, '../gcloud.json');
process.env.GOOGLE_APPLICATION_CREDENTIALS = cred;

// Handle multipart upload
const _multipart = Symbol('multipart');

function setMultipart(req, done) {
    req[_multipart] = true;
    done();
}
app.addContentTypeParser('multipart', setMultipart);

// Error handling
app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    reply.code(404).send('Not found');
});

// curl -X POST -i -F field1=bar -F field2=foo -F filedata=@large.tar http://localhost:4001/finn/assets/js/my-module/8.8.8

app.post(
    `/:org${BASE_ASSETS}/:type/:name/:version`,
    opts,
    async (request, reply) => {
        const stream = await assetPost.handler(
            sink,
            request.req,
            request.params.org,
            request.params.type,
            request.params.name,
            request.params.version
        );

        reply.type(stream.mimeType);
        reply.send(stream);
    }
);

// curl http://localhost:4001/finn/assets/js/my-module/8.8.8/foo
// curl http://localhost:4001/finn/assets/js/my-module/8.8.8/lang.js
// curl -I -X GET http://localhost:4001/finn/assets/js/my-module/8.8.8/lang.js

// TODO: Handle when method is requested without a body (curl -I .....)

app.get(
    `/:org${BASE_ASSETS}/:type/:name/:version/*`,
    opts,
    async (request, reply) => {
        const stream = await assetGet.handler(
            sink,
            request.req,
            request.params.org,
            request.params.type,
            request.params.name,
            request.params.version,
            request.params['*']
        );

        reply.type(stream.mimeType);
        reply.send(stream);
    }
);

// curl -X PUT -i -F version=8.8.8 -F foo=bar http://localhost:4001/finn/alias/js/my-module

app.put(
    `/:org${BASE_ALIAS}/:type/:name/:alias`,
    opts,
    async (request, reply) => {
        const stream = await aliasPut.handler(
            sink,
            request.req,
            request.params.org,
            request.params.type,
            request.params.name,
            request.params.alias
        );

        reply.type(stream.mimeType);
        reply.send(stream);
    }
);

// curl http://localhost:4001/finn/alias/js/my-module/8/lang.js
// curl -L http://localhost:4001/finn/alias/js/my-module/8/lang.js
// curl -I -X GET http://localhost:4001/finn/alias/js/my-module/8/lang.js

app.get(
    `/:org${BASE_ALIAS}/:type/:name/:alias/*`,
    opts,
    async (request, reply) => {
        const stream = await aliasGet.handler(
            sink,
            request.req,
            request.params.org,
            request.params.type,
            request.params.name,
            request.params.alias,
            request.params['*']
        );

        reply.type(stream.mimeType);
        reply.code(stream.statusCode);
        reply.redirect(stream.location);
    }
);

// curl -X DELETE http://localhost:4001/finn/alias/js/my-module/8

app.delete(
    `/:org${BASE_ALIAS}/:type/:name/:alias`,
    opts,
    async (request, reply) => {
        const stream = await aliasDel.handler(
            sink,
            request.req,
            request.params.org,
            request.params.type,
            request.params.name,
            request.params.alias
        );

        reply.type(stream.mimeType);
        reply.send(stream);
    }
);

// curl -X PUT -i -F specifier=lit-html -F address=http://foo.com http://localhost:4001/finn/import-maps/js/global-map

app.put(
    `/:org${BASE_IMPORT_MAPS}/:type/:name`,
    opts,
    async (request, reply) => {
        const stream = await mapPut.handler(
            sink,
            request.req,
            request.params.org,
            request.params.type,
            request.params.name
        );

        reply.type(stream.mimeType);
        reply.send(stream);
    }
);

// curl http://localhost:4001/finn/import-maps/js/global-map

app.get(
    `/:org${BASE_IMPORT_MAPS}/:type/:name`,
    opts,
    async (request, reply) => {
        const stream = await mapGet.handler(
            sink,
            request.req,
            request.params.org,
            request.params.type,
            request.params.name
        );

        reply.type(stream.mimeType);
        reply.send(stream);
    }
);

// curl -X DELETE http://localhost:4001/finn/import-maps/js/global-map

app.delete(
    `/:org${BASE_IMPORT_MAPS}/:type/:name`,
    opts,
    async (request, reply) => {
        const stream = await mapDel.handler(
            sink,
            request.req,
            request.params.org,
            request.params.type,
            request.params.name
        );

        reply.type(stream.mimeType);
        reply.code(stream.statusCode);
        reply.send(stream);
    }
);

app.listen(4001, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
});
