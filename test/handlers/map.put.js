import { PassThrough } from "node:stream";
import { URL } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import Handler from "../../lib/handlers/map.put.js";
import Sink from "../../lib/sinks/test.js";

const FIXTURE_MAP = new URL("../../fixtures/import-map.json", import.meta.url);

const Request = class Request extends PassThrough {
	constructor({ headers = {} } = {}) {
		super();
		this.headers = { host: "localhost", ...headers };
	}
};

test("map.put() - URL parameters is URL encoded", async () => {
	const sink = new Sink();
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append(
		"map",
		new Blob([fs.readFileSync(FIXTURE_MAP)], {
			type: "application/octet-stream",
		}),
		"import-map.json",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	const res = await h.handler(
		req,
		"anton",
		"%40foo%2Fbar-lib",
		"8%2E1%2E4%2D1",
	);

	assert.strictEqual(
		res.statusCode,
		303,
		"should respond with expected status code",
	);
	assert.strictEqual(
		res.location,
		"/map/@foo/bar-lib/8.1.4-1",
		".location should be decoded",
	);
});
