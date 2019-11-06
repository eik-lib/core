'use strict';

const fastify = require('fastify');
const abslog = require('abslog');
const path = require('path');
const { http, sink, prop } = require('../');

class FastifyService {
    constructor({ customSink, port = 4001, logger } = {}) {
        this.sink = customSink || new sink.FS();
        this.log = abslog(logger);
        this.port = port;
        this.app = fastify({ logger: false });

        const cred = path.join(__dirname, '../gcloud.json');
        process.env.GOOGLE_APPLICATION_CREDENTIALS = cred;

        // Handle multipart upload
        const _multipart = Symbol('multipart');

        function setMultipart(req, done) {
            req[_multipart] = true;
            done();
        }
        this.app.addContentTypeParser('multipart', setMultipart);

        // Error handling
        this.app.setErrorHandler((error, request, reply) => {
            // app.log.error(error);
            if (error.statusCode) {
                reply.code(error.statusCode).send(error.message);
                return;
            }
            reply.code(500).send('Internal server error');
        });

        this.routes();

        this._aliasPost = new http.AliasPost(this.sink, {}, logger);
        this._aliasDel = new http.AliasDel(this.sink, {}, logger);
        this._aliasGet = new http.AliasGet(this.sink, {}, logger);
        this._aliasPut = new http.AliasPut(this.sink, {}, logger);
        this._pkgLog = new http.PkgLog(this.sink, {}, logger);
        this._pkgGet = new http.PkgGet(this.sink, {}, logger);
        this._pkgPut = new http.PkgPut(this.sink, {}, logger);
        this._mapGet = new http.MapGet(this.sink, {}, logger);
        this._mapPut = new http.MapPut(this.sink, {}, logger);
    }

    routes() {
        //
        // Packages
        //

        // curl -X GET http://localhost:4001/biz/pkg/fuzz/8.4.1

        this.app.get(
            `/:org/${prop.base_pkg}/:name/:version`, async (request, reply) => {
                const outgoing = await this._pkgLog.handler(
                    request.req,
                    request.params.org,
                    request.params.name,
                    request.params.version,
                );

                reply.type(outgoing.mimeType);
                reply.code(outgoing.statusCode);
                reply.send(outgoing.stream);
            },
        );

        // curl -X GET http://localhost:4001/biz/pkg/fuzz/8.4.1/main/index.js

        this.app.get(
            `/:org/${prop.base_pkg}/:name/:version/*`,
            async (request, reply) => {
                const outgoing = await this._pkgGet.handler(
                    request.req,
                    request.params.org,
                    request.params.name,
                    request.params.version,
                    request.params['*'],
                );

                reply.type(outgoing.mimeType);
                reply.code(outgoing.statusCode);
                reply.send(outgoing.stream);
            },
        );

        // curl -X PUT -i -F filedata=@archive.tgz http://localhost:4001/biz/pkg/fuzz/8.4.1

        this.app.put(
            `/:org/${prop.base_pkg}/:name/:version`,
            async (request, reply) => {
                const outgoing = await this._pkgPut.handler(
                    request.req,
                    request.params.org,
                    request.params.name,
                    request.params.version,
                );

                reply.type(outgoing.mimeType);
                reply.code(outgoing.statusCode);
                reply.redirect(outgoing.location);
            },
        );

        //
        // Import Maps
        //

        // curl -X GET http://localhost:4001/biz/map/buzz/4.2.2

        this.app.get(
            `/:org/${prop.base_map}/:name/:version`,
            async (request, reply) => {
                const outgoing = await this._mapGet.handler(
                    request.req,
                    request.params.org,
                    request.params.name,
                    request.params.version,
                );

                reply.type(outgoing.mimeType);
                reply.code(outgoing.statusCode);
                reply.send(outgoing.stream);
            },
        );

        // curl -X PUT -i -F map=@import-map.json http://localhost:4001/biz/map/buzz/4.2.2

        this.app.put(
            `/:org/${prop.base_map}/:name/:version`,
            async (request, reply) => {
                const outgoing = await this._mapPut.handler(
                    request.req,
                    request.params.org,
                    request.params.name,
                    request.params.version,
                );

                reply.type(outgoing.mimeType);
                reply.code(outgoing.statusCode);
                reply.redirect(outgoing.location);
            },
        );

        //
        // Alias Packages
        //

        // curl -X GET -L http://localhost:4001/biz/pkg/fuzz/v8

        this.app.get(
            `/:org/${prop.base_pkg}/:name/v:alias`,
            async (request, reply) => {
                const outgoing = await this._aliasGet.handler(
                    request.req,
                    request.params.org,
                    prop.base_pkg,
                    request.params.name,
                    request.params.alias,
                );

                reply.type(outgoing.mimeType);
                reply.code(outgoing.statusCode);
                reply.redirect(outgoing.location);
            },
        );

        // curl -X GET -L http://localhost:4001/biz/pkg/fuzz/v8/main/index.js

        this.app.get(
            `/:org/${prop.base_pkg}/:name/v:alias/*`,
            async (request, reply) => {
                const outgoing = await this._aliasGet.handler(
                    request.req,
                    request.params.org,
                    prop.base_pkg,
                    request.params.name,
                    request.params.alias,
                    request.params['*'],
                );

                reply.type(outgoing.mimeType);
                reply.code(outgoing.statusCode);
                reply.redirect(outgoing.location);
            },
        );

        // curl -X PUT -i -F version=8.4.1 http://localhost:4001/biz/pkg/fuzz/v8

        this.app.put(
            `/:org/${prop.base_pkg}/:name/v:alias`,
            async (request, reply) => {
                const outgoing = await this._aliasPut.handler(
                    request.req,
                    request.params.org,
                    prop.base_pkg,
                    request.params.name,
                    request.params.alias,
                );

                reply.type(outgoing.mimeType);
                reply.code(outgoing.statusCode);
                reply.redirect(outgoing.location);
            },
        );

        // curl -X POST -i -F version=8.4.1 http://localhost:4001/biz/pkg/lit-html/v8

        this.app.post(
            `/:org/${prop.base_pkg}/:name/v:alias`,
            async (request, reply) => {
                const outgoing = await this._aliasPost.handler(
                    request.req,
                    request.params.org,
                    prop.base_pkg,
                    request.params.name,
                    request.params.alias,
                );

                reply.type(outgoing.mimeType);
                reply.code(outgoing.statusCode);
                reply.redirect(outgoing.location);
            },
        );

        // curl -X DELETE http://localhost:4001/biz/pkg/fuzz/v8

        this.app.delete(
            `/:org/${prop.base_pkg}/:name/v:alias`,
            async (request, reply) => {
                const outgoing = await this._aliasDel.handler(
                    request.req,
                    request.params.org,
                    prop.base_pkg,
                    request.params.name,
                    request.params.alias,
                );

                reply.type(outgoing.mimeType);
                reply.code(outgoing.statusCode);
                reply.send(outgoing.body);
            },
        );

        //
        // Alias Import Maps
        //

        // curl -X GET -L http://localhost:4001/biz/map/buzz/v4

        this.app.get(
            `/:org/${prop.base_map}/:name/v:alias`,
            async (request, reply) => {
                const outgoing = await this._aliasGet.handler(
                    request.req,
                    request.params.org,
                    prop.base_map,
                    request.params.name,
                    request.params.alias,
                );

                reply.type(outgoing.mimeType);
                reply.code(outgoing.statusCode);
                reply.redirect(outgoing.location);
            },
        );

        // curl -X PUT -i -F version=4.2.2 http://localhost:4001/biz/map/buzz/v4

        this.app.put(
            `/:org/${prop.base_map}/:name/v:alias`,
            async (request, reply) => {
                const outgoing = await this._aliasPut.handler(
                    request.req,
                    request.params.org,
                    prop.base_map,
                    request.params.name,
                    request.params.alias,
                );

                reply.type(outgoing.mimeType);
                reply.code(outgoing.statusCode);
                reply.redirect(outgoing.location);
            },
        );

        // curl -X POST -i -F version=4.4.2 http://localhost:4001/biz/map/buzz/v4

        this.app.post(
            `/:org/${prop.base_map}/:name/v:alias`,
            async (request, reply) => {
                const outgoing = await this._aliasPost.handler(
                    request.req,
                    request.params.org,
                    prop.base_map,
                    request.params.name,
                    request.params.alias,
                );

                reply.type(outgoing.mimeType);
                reply.code(outgoing.statusCode);
                reply.redirect(outgoing.location);
            },
        );

        // curl -X DELETE http://localhost:4001/biz/map/buzz/v4

        this.app.delete(
            `/:org/${prop.base_map}/:name/v:alias`,
            async (request, reply) => {
                const outgoing = await this._aliasDel.handler(
                    request.req,
                    request.params.org,
                    prop.base_map,
                    request.params.name,
                    request.params.alias,
                );

                reply.type(outgoing.mimeType);
                reply.code(outgoing.statusCode);
                reply.send(outgoing.body);
            },
        );
    }

    async start() {
        try {
            const address = await this.app.listen(this.port);
            return address;
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
