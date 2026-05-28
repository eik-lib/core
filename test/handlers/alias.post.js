import { PassThrough } from "node:stream";
import { test } from "node:test";
import assert from "node:assert/strict";
import HttpError from "http-errors";

import Handler from "../../lib/handlers/alias.post.js";
import Sink from "../../lib/sinks/test.js";

const Request = class Request extends PassThrough {
	constructor({ headers = {} } = {}) {
		super();
		this.headers = { host: "localhost", ...headers };
	}
};

test("alias.post() - URL parameters is URL encoded", async () => {
	const sink = new Sink();
	sink.set("/local/pkg/@foo/bar-lib/8.1.4-1.package.json", "payload");
	sink.set("/local/pkg/@foo/bar-lib/8.alias.json", "payload");

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

test("alias.post() - Prevent non-existing package to map to alias", async () => {
	const sink = new Sink();
	sink.set("/local/pkg/@foo/bar-lib/8.alias.json", "payload");

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
