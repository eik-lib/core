'use strict';

const fastify = require('fastify');
const path = require('path');
const { http, sink, prop } = require('../');

class FastifyService {
    constructor({ customSink, port = 4001, logger = true } = {}) {
        const app = fastify({ logger });
        this.sink = customSink || new sink.FS();
        this.port = port;
        this.app = app;

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
            if (error.statusCode) {
                reply.code(error.statusCode).send(error.message);
                return;
            }
            reply.code(500).send('Internal server error');
        });

        this.routes();
    }

    routes() {
        //
        // Packages
        //

        // curl -X GET http://localhost:4001/biz/pkg/fuzz/8.4.1/main/index.js

        this.app.get(
            `/:org/${prop.base_pkg}/:name/:version/*`,
            async (request, reply) => {
                const stream = await http.pkgGet.handler(
                    this.sink,
                    request.req,
                    request.params.org,
                    request.params.name,
                    request.params.version,
                    request.params['*'],
                );

                reply.type(stream.mimeType);
                reply.send(stream);
            },
        );

        // curl -X PUT -i -F filedata=@archive.tgz http://localhost:4001/biz/pkg/fuzz/8.4.1

        this.app.put(
            `/:org/${prop.base_pkg}/:name/:version`,
            async (request, reply) => {
                const stream = await http.pkgPut.handler(
                    this.sink,
                    request.req,
                    request.params.org,
                    request.params.name,
                    request.params.version,
                );

                reply.type(stream.mimeType);
                reply.send(stream);
            },
        );

        //
        // Import Maps
        //

        // curl -X GET http://localhost:4001/biz/map/buzz/4.2.2

        this.app.get(
            `/:org/${prop.base_map}/:name/:version`,
            async (request, reply) => {
                const stream = await http.mapGet.handler(
                    this.sink,
                    request.req,
                    request.params.org,
                    request.params.name,
                    request.params.version,
                );

                reply.type(stream.mimeType);
                reply.send(stream);
            },
        );

        // curl -X PUT -i -F map=@import-map.json http://localhost:4001/biz/map/buzz/4.2.2

        this.app.put(
            `/:org/${prop.base_map}/:name/:version`,
            async (request, reply) => {
                const stream = await http.mapPut.handler(
                    this.sink,
                    request.req,
                    request.params.org,
                    request.params.name,
                    request.params.version,
                );

                reply.type(stream.mimeType);
                reply.send(stream);
            },
        );

        //
        // Alias Packages
        //

        // curl -X GET -L http://localhost:4001/biz/pkg/fuzz/v8/main/index.js

        this.app.get(
            `/:org/${prop.base_pkg}/:name/v:alias/*`,
            async (request, reply) => {
                const stream = await http.aliasGet.handler(
                    this.sink,
                    request.req,
                    request.params.org,
                    prop.base_pkg,
                    request.params.name,
                    request.params.alias,
                    request.params['*'],
                );

                reply.type(stream.mimeType);
                reply.code(stream.statusCode);
                reply.redirect(stream.location);
            },
        );

        // curl -X PUT -i -F version=8.4.1 http://localhost:4001/biz/pkg/fuzz/v8

        this.app.put(
            `/:org/${prop.base_pkg}/:name/v:alias`,
            async (request, reply) => {
                const stream = await http.aliasPut.handler(
                    this.sink,
                    request.req,
                    request.params.org,
                    prop.base_pkg,
                    request.params.name,
                    request.params.alias,
                );

                reply.type(stream.mimeType);
                reply.send(stream);
            },
        );

        // curl -X POST -i -F version=8.4.1 http://localhost:4001/biz/pkg/lit-html/v8

        this.app.post(
            `/:org/${prop.base_pkg}/:name/v:alias`,
            async (request, reply) => {
                const stream = await http.aliasPost.handler(
                    this.sink,
                    request.req,
                    request.params.org,
                    prop.base_pkg,
                    request.params.name,
                    request.params.alias,
                );

                reply.type(stream.mimeType);
                reply.send(stream);
            },
        );

        // curl -X DELETE http://localhost:4001/biz/pkg/fuzz/v8

        this.app.delete(
            `/:org/${prop.base_pkg}/:name/v:alias`,
            async (request, reply) => {
                const stream = await http.aliasDel.handler(
                    this.sink,
                    request.req,
                    request.params.org,
                    prop.base_pkg,
                    request.params.name,
                    request.params.alias,
                );

                reply.type(stream.mimeType);
                reply.send(stream);
            },
        );

        //
        // Alias Import Maps
        //

        // curl -X GET -L http://localhost:4001/biz/map/buzz/v4

        this.app.get(
            `/:org/${prop.base_map}/:name/v:alias`,
            async (request, reply) => {
                const stream = await http.aliasGet.handler(
                    this.sink,
                    request.req,
                    request.params.org,
                    prop.base_map,
                    request.params.name,
                    request.params.alias,
                );

                reply.type(stream.mimeType);
                reply.code(stream.statusCode);
                reply.redirect(stream.location);
            },
        );

        // curl -X PUT -i -F version=4.2.2 http://localhost:4001/biz/map/buzz/v4

        this.app.put(
            `/:org/${prop.base_map}/:name/v:alias`,
            async (request, reply) => {
                const stream = await http.aliasPut.handler(
                    this.sink,
                    request.req,
                    request.params.org,
                    prop.base_map,
                    request.params.name,
                    request.params.alias,
                );

                reply.type(stream.mimeType);
                reply.send(stream);
            },
        );

        // curl -X POST -i -F version=4.4.2 http://localhost:4001/biz/map/buzz/v4

        this.app.post(
            `/:org/${prop.base_map}/:name/v:alias`,
            async (request, reply) => {
                const stream = await http.aliasPost.handler(
                    this.sink,
                    request.req,
                    request.params.org,
                    prop.base_map,
                    request.params.name,
                    request.params.alias,
                );

                reply.type(stream.mimeType);
                reply.send(stream);
            },
        );

        // curl -X DELETE http://localhost:4001/biz/map/buzz/v4

        this.app.delete(
            `/:org/${prop.base_map}/:name/v:alias`,
            async (request, reply) => {
                const stream = await http.aliasDel.handler(
                    this.sink,
                    request.req,
                    request.params.org,
                    prop.base_map,
                    request.params.name,
                    request.params.alias,
                );

                reply.type(stream.mimeType);
                reply.send(stream);
            },
        );
    }

    async start() {
        try {
            await this.app.listen(this.port);
        } catch (err) {
            this.app.log.error(err);
            throw err;
        }
    }

    async stop() {
        try {
            await this.app.close();
        } catch (err) {
            this.app.log.error(err);
            throw err;
        }
    }
}

module.exports = FastifyService;

if (require.main === module) {
    const service = new FastifyService();
    service.start().catch(() => {
        process.exit(1);
    });
}
