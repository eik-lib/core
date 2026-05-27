import { PassThrough } from "node:stream";
import { test } from "node:test";
import assert from "node:assert/strict";

import Handler from "../../lib/handlers/alias.delete.js";
import Sink from "../../lib/sinks/test.js";

const Request = class Request extends PassThrough {
	constructor({ headers = {} } = {}) {
		super();
		this.headers = { host: "localhost", ...headers };
	}
};

test("alias.delete() - URL parameters is URL encoded", async () => {
	const sink = new Sink();
	sink.set("/local/pkg/@foo/foo-bar/8.alias.json", "payload");

	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append("version", "8.1.4-1");

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	const res = await h.handler(req, "anton", "pkg", "%40foo%2Ffoo-bar", "8");

	assert.strictEqual(
		res.statusCode,
		204,
		"should respond with expected status code",
	);
	assert.strictEqual(
		sink.get("/pkg/@foo/foo-bar/8.alias.json"),
		null,
		"should delete alias from sink",
	);
});
