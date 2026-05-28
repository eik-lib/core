import { Writable, PassThrough, pipeline } from "node:stream";
import { test } from "node:test";
import assert from "node:assert/strict";

import Handler from "../../lib/handlers/versions.get.js";
import Sink from "../../lib/sinks/test.js";

const pipeInto = (/** @type {any[]} */ ...streams) =>
	new Promise((resolve, reject) => {
		/** @type {any[]} */
		const buffer = [];

		const to = new Writable({
			objectMode: false,
			write(chunk, encoding, callback) {
				buffer.push(chunk);
				callback();
			},
		});

		// @ts-expect-error
		pipeline(...streams, to, (error) => {
			if (error) return reject(error);
			const str = buffer.join("").toString();
			return resolve(str);
		});
	});

const Request = class Request extends PassThrough {
	constructor({ headers = {} } = {}) {
		super();
		this.headers = { host: "localhost", ...headers };
	}
};

test("versions.get() - URL parameters is URL encoded", async () => {
	const sink = new Sink();
	sink.set("/local/pkg/@foo/bar-lib/versions.json", "payload");

	const h = new Handler({ sink });
	const req = new Request();

	const res = await h.handler(req, "pkg", "%40foo%2Fbar-lib");
	const result = await pipeInto(res.stream);

	assert.strictEqual(
		res.statusCode,
		200,
		"should respond with expected status code",
	);
	assert.strictEqual(
		result,
		"payload",
		"should be possible to retrieve a payload when handlers values is URL encoded",
	);
});
