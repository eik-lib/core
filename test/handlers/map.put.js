import { PassThrough } from "node:stream";
import { URL } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import HttpError from "http-errors";

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

test("map.put() - infrastructure error reading versions index propagates as 502 and does not overwrite version history", async () => {
	// Regression test: same silent-overwrite risk as in pkg.put — a
	// transient sink error during _readVersions must not be swallowed.
	const inner = new Sink();
	inner.set(
		"/local/map/my-map/versions.json",
		JSON.stringify({
			versions: [[1, { version: "1.0.3", integrity: "sha512-existinghash" }]],
			type: "map",
			name: "my-map",
			org: "local",
		}),
	);

	const faultySink = {
		write: inner.write.bind(inner),
		read: (/** @type {string} */ filePath) => {
			if (filePath === "/local/map/my-map/versions.json") {
				return Promise.reject(new Error("Simulated infrastructure error"));
			}
			return inner.read(filePath);
		},
		exist: inner.exist.bind(inner),
		delete: inner.delete.bind(inner),
		get metrics() {
			return inner.metrics;
		},
	};

	const h = new Handler({ sink: /** @type {any} */ (faultySink) });

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

	await assert.rejects(
		h.handler(req, "anton", "my-map", "1.0.9"),
		HttpError.BadGateway,
		"should reject with 502 when the versions index cannot be read",
	);

	const raw = inner.get("/local/map/my-map/versions.json");
	const parsed = JSON.parse(/** @type {string} */ (raw));
	assert.strictEqual(
		parsed.versions[0][0],
		1,
		"existing version history should be preserved",
	);
});
