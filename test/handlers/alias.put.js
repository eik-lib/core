import { PassThrough } from "node:stream";
import { test } from "node:test";
import assert from "node:assert/strict";
import HttpError from "http-errors";

import Handler from "../../lib/handlers/alias.put.js";
import Sink from "../../lib/sinks/test.js";

const Request = class Request extends PassThrough {
	constructor({ headers = {} } = {}) {
		super();
		this.headers = { host: "localhost", ...headers };
	}
};

test("alias.put() - URL parameters is URL encoded", async () => {
	const sink = new Sink();
	sink.set("/local/pkg/@foo/bar-lib/8.1.4-1.package.json", "payload");
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append("version", "8.1.4-1");

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	const res = await h.handler(req, "anton", "pkg", "%40foo%2Fbar-lib", "8");

	assert.strictEqual(
		res.statusCode,
		303,
		"should respond with expected status code",
	);
	assert.strictEqual(
		res.location,
		"/pkg/@foo/bar-lib/v8",
		".location should be decoded",
	);
});

test("alias.put() - Prevent non-existing package to map to alias", async () => {
	const sink = new Sink();
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append("version", "8.1.4-1");

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	await assert.rejects(
		h.handler(req, "anton", "pkg", "%40foo%2Fbar-lib", "8"),
		HttpError.NotFound,
	);
});

test("alias.put() - Map alias to existing npm package", async () => {
	const sink = new Sink();
	sink.set("/local/npm/@bar/baz/17.0.2.package.json", "payload");

	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append("version", "17.0.2");

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	const res = await h.handler(req, "anton", "npm", "%40bar%2Fbaz", "8");

	assert.strictEqual(
		res.statusCode,
		303,
		"should respond with expected status code",
	);
	assert.strictEqual(
		res.location,
		"/npm/@bar/baz/v8",
		".location should be decoded",
	);
});

test("alias.put() - Prevent non-existing npm to map to alias", async () => {
	const sink = new Sink();
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append("version", "17.0.2");

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	await assert.rejects(
		h.handler(req, "anton", "npm", "%40bar%2Fbaz", "8"),
		HttpError.NotFound,
	);
});

test("alias.put() - Map alias to existing import-map", async () => {
	const sink = new Sink();
	sink.set("/local/map/@cuz/fuzz/8.1.4.import-map.json", "payload");

	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append("version", "8.1.4");

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	const res = await h.handler(req, "anton", "map", "%40cuz%2Ffuzz", "8");

	assert.strictEqual(
		res.statusCode,
		303,
		"should respond with expected status code",
	);
	assert.strictEqual(
		res.location,
		"/map/@cuz/fuzz/v8",
		".location should be decoded",
	);
});

test("alias.put() - Prevent non-existing import-map to map to alias", async () => {
	const sink = new Sink();
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append("version", "8.1.4");

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	await assert.rejects(
		h.handler(req, "anton", "map", "%40cuz%2Ffuzz", "8"),
		HttpError.NotFound,
	);
});
