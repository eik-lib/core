import { PassThrough } from "node:stream";
import HttpError from "http-errors";
import { URL } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import Handler from "../../lib/handlers/pkg.put.js";
import Sink from "../../lib/sinks/test.js";

const FIXTURE_TAR = new URL("../../fixtures/package.tar", import.meta.url);
const FIXTURE_BZ2 = new URL("../../fixtures/package.tar.bz2", import.meta.url);
const FIXTURE_GZ = new URL("../../fixtures/package.tar.gz", import.meta.url);

const FIXTURE_PKG = new URL("../../fixtures/archive.tgz", import.meta.url);
const FIXTURE_MAP = new URL("../../fixtures/import-map.json", import.meta.url);

const Request = class Request extends PassThrough {
	constructor({ headers = {} } = {}) {
		super();
		this.headers = { host: "localhost", ...headers };
	}
};

test("pkg.put() - Allow publishing of previous version", async () => {
	const sink = new Sink();
	sink.set("/local/pkg/fuzz/1.0.1/eik.json", "payload");
	sink.set("/local/pkg/fuzz/1.0.3/eik.json", "payload");

	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append(
		"package",
		new Blob([fs.readFileSync(FIXTURE_TAR)], {
			type: "application/octet-stream",
		}),
		"package.tar",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	const res = await h.handler(req, "anton", "pkg", "fuzz", "1.0.2");
	assert.strictEqual(
		res.cacheControl,
		"no-store",
		'.cacheControl should be "no-store"',
	);
	assert.strictEqual(res.statusCode, 303, '.statusCode should be "303"');
	assert.strictEqual(
		res.mimeType,
		"text/plain",
		'.mimeType should be "text/plain"',
	);
	assert.strictEqual(
		res.location,
		"/pkg/fuzz/1.0.2",
		'.location should be "/pkg/fuzz/1.0.2"',
	);
});

test("pkg.put() - Reject publishing of same version", async () => {
	const sink = new Sink();
	sink.set("/local/pkg/fuzz/8.4.1/eik.json", "payload");

	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append(
		"package",
		new Blob([fs.readFileSync(FIXTURE_TAR)], {
			type: "application/octet-stream",
		}),
		"package.tar",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	await assert.rejects(
		h.handler(req, "anton", "pkg", "fuzz", "8.4.1"),
		HttpError.Conflict,
		"should reject with conflict error. Version already exists",
	);
});

test('pkg.put() - The "type" argument is invalid', async () => {
	const h = new Handler();
	await assert.rejects(
		h.handler({}, "anton", "zaaap", "fuzz", "8.4.1"),
		HttpError.BadRequest,
		"should reject with bad request error",
	);
});

test('pkg.put() - The "name" argument is invalid', async () => {
	const h = new Handler();
	await assert.rejects(
		h.handler({}, "anton", "pkg", /** @type {any} */ (null), "8.4.1"),
		HttpError.BadRequest,
		"should reject with bad request error",
	);
});

test('pkg.put() - The "version" argument is invalid', async () => {
	const h = new Handler();
	await assert.rejects(
		h.handler({}, "anton", "pkg", "fuzz", "zaaap"),
		HttpError.BadRequest,
		"should reject with bad request error",
	);
});

test("pkg.put() - Successful upload of .tar file", async () => {
	const sink = new Sink();
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append(
		"package",
		new Blob([fs.readFileSync(FIXTURE_TAR)], {
			type: "application/octet-stream",
		}),
		"package.tar",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	const res = await h.handler(req, "anton", "pkg", "fuzz", "8.4.1");

	assert.strictEqual(
		res.cacheControl,
		"no-store",
		'.cacheControl should be "no-store"',
	);
	assert.strictEqual(res.statusCode, 303, '.statusCode should be "303"');
	assert.strictEqual(
		res.mimeType,
		"text/plain",
		'.mimeType should be "text/plain"',
	);
	assert.strictEqual(
		res.location,
		"/pkg/fuzz/8.4.1",
		'.location should be "/pkg/fuzz/8.4.1"',
	);
});

test("pkg.put() - URL parameters is URL encoded", async () => {
	const sink = new Sink();
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append(
		"package",
		new Blob([fs.readFileSync(FIXTURE_TAR)], {
			type: "application/octet-stream",
		}),
		"package.tar",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	const res = await h.handler(
		req,
		"anton",
		"pkg",
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
		"/pkg/@foo/bar-lib/8.1.4-1",
		".location should be decoded",
	);
});

test("pkg.put() - Successful upload of .tar.gz file", async () => {
	const sink = new Sink();
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append(
		"package",
		new Blob([fs.readFileSync(FIXTURE_GZ)], {
			type: "application/octet-stream",
		}),
		"package.tar.gz",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	const res = await h.handler(req, "anton", "pkg", "fuzz", "8.4.1");

	assert.strictEqual(
		res.cacheControl,
		"no-store",
		'.cacheControl should be "no-store"',
	);
	assert.strictEqual(res.statusCode, 303, '.statusCode should be "303"');
	assert.strictEqual(
		res.mimeType,
		"text/plain",
		'.mimeType should be "text/plain"',
	);
	assert.strictEqual(
		res.location,
		"/pkg/fuzz/8.4.1",
		'.location should be "/pkg/fuzz/8.4.1"',
	);
});

test("pkg.put() - File is not a tar file", async () => {
	const sink = new Sink();
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append(
		"package",
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
		h.handler(req, "anton", "pkg", "fuzz", "8.4.1"),
		HttpError.UnsupportedMediaType,
		"should reject with unsupported media type error",
	);
});

test("pkg.put() - File is not a compatible file or contain an error", async () => {
	const sink = new Sink();
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append(
		"package",
		new Blob([fs.readFileSync(FIXTURE_BZ2)], {
			type: "application/octet-stream",
		}),
		"package.tar.bz2",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	await assert.rejects(
		h.handler(req, "anton", "pkg", "fuzz", "8.4.1"),
		HttpError.UnprocessableEntity,
		"should reject with unprocessable entry error",
	);
});

test("pkg.put() - Form field is not valid", async () => {
	const sink = new Sink();
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append(
		"pkg",
		new Blob([fs.readFileSync(FIXTURE_PKG)], {
			type: "application/octet-stream",
		}),
		"archive.tgz",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	await assert.rejects(
		h.handler(req, "anton", "pkg", "fuzz", "8.4.1"),
		HttpError.BadRequest,
		"should reject with bad request error",
	);
});

test("pkg.put() - File exceeds legal file size limit", async () => {
	const sink = new Sink();
	const h = new Handler({
		pkgMaxFileSize: 100,
		sink,
	});

	const formData = new FormData();
	formData.append(
		"package",
		new Blob([fs.readFileSync(FIXTURE_PKG)], {
			type: "application/octet-stream",
		}),
		"archive.tgz",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	await assert.rejects(
		h.handler(req, "anton", "pkg", "fuzz", "8.4.1"),
		HttpError.PayloadTooLarge,
		"should reject with payload too large error",
	);
});
