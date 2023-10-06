import { validators } from '@eik/common';

/**
 * A bearer object to hold misc data through a http
 * request / response cyclus.
 * @class HttpIncoming
 */
const HttpIncoming = class HttpIncoming {
    constructor(
        request,
        {
            version = '',
            extras = '',
            author = {},
            alias = '',
            type = '',
            name = '',
            org = '',
        } = {},
    ) {
        this._version = version;
        this._extras = extras;
        this._author = author;
        this._alias = alias;
        this._type = type;
        this._name = name;
        this._org = org;

        this._request = request;
        this._headers = request ? request.headers : {};
        
        this._handle = '';
    }

    set version(value) {
        this._version = validators.version(value);
    }

    get version() {
        return this._version;
    }

    set extras(value) {
        this._extras = validators.extra(value);
    }

    get extras() {
        return this._extras;
    }

    set author(value) {
        this._author = value;
    }

    get author() {
        return this._author;
    }

    get alias() {
        return this._alias;
    }

    set name(value) {
        this._name = validators.name(value);
    }

    get name() {
        return this._name;
    }

    set type(value) {
        this._type = validators.type(value);
    }

    get type() {
        return this._type;
    }

    set org(value) {
        this._org = value;
    }

    get org() {
        return this._org;
    }

    get request() {
        return this._request;
    }

    get headers() {
        return this._headers;
    }

    set handle(value) {
        this._handle = value;
    }

    get handle() {
        return this._handle;
    }

    get [Symbol.toStringTag]() {
        return 'HttpIncoming';
    }
};

export default HttpIncoming;
