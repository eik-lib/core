/**
 * A bearer object to hold misc data through a http
 * request / response cyclus.
 * @class HttpIncoming
 */
const HttpIncoming = class HttpIncoming {
	constructor(
		request,
		{
			version = "",
			extras = "",
			author = {},
			alias = "",
			type = "",
			name = "",
			org = "",
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
	}

	get version() {
		return this._version;
	}

	get extras() {
		return this._extras;
	}

	get author() {
		return this._author;
	}

	get alias() {
		return this._alias;
	}

	get name() {
		return this._name;
	}

	get type() {
		return this._type;
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

	get [Symbol.toStringTag]() {
		return "HttpIncoming";
	}
};

export default HttpIncoming;
