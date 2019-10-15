'use strict';

const HttpIncoming = require('../classes/http-incoming');
const HttpOutgoing = require('../classes/http-outgoing');
const { Duplex } = require('stream');
const Busboy = require('busboy');
const Alias = require('../classes/alias');
const utils = require('../utils/utils');

const Parser = class Parser extends Duplex {
    constructor(sink, incoming, alias) {
        super();

        this.alias = new Alias(incoming);
        this.alias.alias = alias;
        this.sink = sink;

        this.parser = new Busboy({
            headers: incoming.headers,
            limits: {
                fileSize: 1000,
            },
        });

        this.parser.on(
            'field',
            (
                name,
                value,
                fieldnameTruncated,
                valTruncated,
                encoding,
                mimetype
            ) => {
                console.log('field is:', name);
                if (name === 'version') {
                    this.alias.version = value;
                }
            }
        );

        this.parser.on('partsLimit', () => {
            const error = new Error('Payload Too Large');
            this.destroy(error);
        });

        this.parser.on('filesLimit', () => {
            const error = new Error('Payload Too Large');
            this.destroy(error);
        });

        this.parser.on('fieldsLimit', () => {
            const error = new Error('Payload Too Large');
            this.destroy(error);
        });

        this.parser.on('finish', async () => {
            // TODO: try/catch and error handling
            try {
                const buffer = await utils.writeJSON(
                    sink,
                    this.alias.path,
                    this.alias,
                    'application/json'
                );

                // Terminate the Duplex stream
                this.push(buffer);
                this.push(null);
            } catch (err) {
                console.log(err);
            }
        });
    }

    _read() {
        // Push to readable happens in constructor
    }

    _write(chunk, enc, cb) {
        this.parser.write(chunk);
        cb();
    }

    _final(cb) {
        cb();
    }
};

const params = {
    type: 'object',
    properties: {
        alias: {
            type: 'string',
            minLength: 1,
            maxLength: 64,
            pattern: '^[a-zA-Z0-9_-]*$',
        },
        type: { type: 'string' },
        name: { type: 'string' },
        org: { type: 'string' },
    },
};
module.exports.params = params;

const handler = (sink, req, org, type, name, alias) => {
    if (typeof org !== 'string' || org === '') {
        throw new TypeError(
            ':org is a required url parameter and must be a string'
        );
    }

    if (typeof type !== 'string' || type === '') {
        throw new TypeError(
            ':type is a required url parameter and must be a string'
        );
    }

    if (typeof name !== 'string' || name === '') {
        throw new TypeError(
            ':name is a required url parameter and must be a string'
        );
    }

    if (typeof alias !== 'string' || alias === '') {
        throw new TypeError(
            ':alias is a required url parameter and must be a string'
        );
    }

    return new Promise((resolve, reject) => {
        const incoming = new HttpIncoming(req, {
            name,
            type,
            org,
        });

        const outgoing = new HttpOutgoing();
        const parser = new Parser(sink, incoming, alias);

        outgoing.mimeType = 'application/octet-stream';

        incoming.request.pipe(parser).pipe(outgoing);
        resolve(outgoing);
    });
};
module.exports.handler = handler;
