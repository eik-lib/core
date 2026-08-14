import { Writable, PassThrough, pipeline } from "node:stream";
import { test } from "node:test";
import assert from "node:assert/strict";
import HttpError from "http-errors";

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

test("versions.get() - returns 404 for a package that does not exist", async () => {
	const sink = new Sink(); // empty sink — no versions.json
	const h = new Handler({ sink });
	const req = new Request();

	await assert.rejects(
		h.handler(req, "pkg", "fuzz"),
		HttpError.NotFound,
		"should reject with 404 when the package has no versions index",
	);
});

test("versions.get() - infrastructure error reading versions index propagates as 502 not 404", async () => {
	// Regression test: the handler previously caught all sink errors and
	// returned 404, making transient GCS failures indistinguishable from
	// a genuinely missing package. Callers that treat 404 as "package does
	// not exist" would then reset the package to version 0.0.1.
	const inner = new Sink();
	inner.set("/local/pkg/fuzz/versions.json", "{}");

	// exist() resolves (file is present) but read() throws — simulates a
	// transient infrastructure error after the file is known to exist.
	const faultySink = {
		exist: inner.exist.bind(inner),
		read: (/** @type {string} */ filePath) => {
			if (filePath === "/local/pkg/fuzz/versions.json") {
				return Promise.reject(new Error("Simulated infrastructure error"));
			}
			return inner.read(filePath);
		},
		write: inner.write.bind(inner),
		delete: inner.delete.bind(inner),
		get metrics() {
			return inner.metrics;
		},
	};

	const h = new Handler({ sink: /** @type {any} */ (faultySink) });
	const req = new Request();

	await assert.rejects(
		h.handler(req, "pkg", "fuzz"),
		HttpError.BadGateway,
		"should reject with 502 when the versions index exists but cannot be read",
	);
});
