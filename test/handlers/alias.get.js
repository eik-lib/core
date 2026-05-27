import { PassThrough } from "node:stream";
import { test } from "node:test";
import assert from "node:assert/strict";

import Handler from "../../lib/handlers/alias.get.js";
import Alias from "../../lib/classes/alias.js";
import Sink from "../../lib/sinks/test.js";

const Request = class Request extends PassThrough {
	constructor({ headers = {} } = {}) {
		super();
		this.headers = { host: "localhost", ...headers };
	}
};

test("alias.get() - URL parameters is URL encoded", async () => {
	const sink = new Sink();
	const alias = new Alias({
		alias: "8",
		name: "@foo/bar-lib",
		type: "pkg",
		org: "localhost",
	});
	alias.version = "8.1.4-1";
	sink.set("/local/pkg/@foo/bar-lib/8.alias.json", JSON.stringify(alias));

	const h = new Handler({ sink });
	const req = new Request();
	const res = await h.handler(
		req,
		"pkg",
		"%40foo%2Fbar-lib",
		"8",
		"%2Ffoo%2Fmain.js",
	);

	assert.strictEqual(
		res.statusCode,
		302,
		"should respond with expected status code",
	);
	assert.strictEqual(
		res.location,
		"/pkg/@foo/bar-lib/8.1.4-1/foo/main.js",
		".location should be decoded",
	);
});
