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
const FIXTURE_PKG_WITH_EIK_JSON = new URL(
	"../../fixtures/archive-with-eik-json.tgz",
	import.meta.url,
);
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

test("pkg.put() - Server writes eik.json to sink after successful upload", async () => {
	const sink = new Sink();
	const h = new Handler({ sink });

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

	await h.handler(req, "anton", "pkg", "fuzz", "1.0.2");

	const raw = sink.get("/local/pkg/fuzz/1.0.2/eik.json");
	assert.ok(raw !== null, "eik.json should be written to the sink");

	const written = JSON.parse(raw);
	assert.strictEqual(
		written.name,
		"fuzz",
		"should have server-authoritative name",
	);
	assert.strictEqual(
		written.version,
		"1.0.2",
		"should have server-authoritative version",
	);
	assert.strictEqual(
		written.type,
		"pkg",
		"should have server-authoritative type",
	);
});

test("pkg.put() - Server merges client eik.json fields into the server-written eik.json", async () => {
	const sink = new Sink();
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append(
		"package",
		new Blob([fs.readFileSync(FIXTURE_PKG_WITH_EIK_JSON)], {
			type: "application/octet-stream",
		}),
		"archive.tgz",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	await h.handler(req, "anton", "pkg", "fuzz", "1.0.2");

	const raw = sink.get("/local/pkg/fuzz/1.0.2/eik.json");
	assert.ok(raw !== null, "eik.json should be written to the sink");

	const written = JSON.parse(raw);

	// Server-authoritative fields override client values
	assert.strictEqual(
		written.name,
		"fuzz",
		"server-authoritative name from URL path should override client value",
	);
	assert.strictEqual(
		written.version,
		"1.0.2",
		"server-authoritative version from URL path should override client value",
	);
	assert.strictEqual(
		written.type,
		"pkg",
		"should have server-authoritative type",
	);

	// Client fields are preserved in the merged output
	assert.strictEqual(
		written.server,
		"http://localhost",
		"client field 'server' should be preserved in the merged eik.json",
	);
	assert.ok(
		written.files !== undefined,
		"client field 'files' should be preserved in the merged eik.json",
	);
});

test("pkg.put() - Server writes eik.json even when tar contains no eik.json", async () => {
	const sink = new Sink();
	const h = new Handler({ sink });

	// FIXTURE_PKG (archive.tgz) contains no eik.json
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

	await h.handler(req, "anton", "pkg", "fuzz", "1.0.2");

	const raw = sink.get("/local/pkg/fuzz/1.0.2/eik.json");
	assert.ok(
		raw !== null,
		"eik.json should be written to the sink even when not provided in the tar",
	);

	const written = JSON.parse(raw);
	assert.strictEqual(
		written.name,
		"fuzz",
		"should contain server-authoritative name",
	);
	assert.strictEqual(
		written.version,
		"1.0.2",
		"should contain server-authoritative version",
	);
	assert.strictEqual(
		written.type,
		"pkg",
		"should contain server-authoritative type",
	);
});

test("pkg.put() - eik.json in sink acts as committed marker preventing re-upload", async () => {
	const sink = new Sink();

	// Upload version 1.0.2 successfully
	const h = new Handler({ sink });
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
	await h.handler(req, "anton", "pkg", "fuzz", "1.0.2");

	// Retry the same version — should be rejected with Conflict
	const formData2 = new FormData();
	formData2.append(
		"package",
		new Blob([fs.readFileSync(FIXTURE_PKG)], {
			type: "application/octet-stream",
		}),
		"archive.tgz",
	);
	const _response2 = new Response(formData2);
	const headers2 = { "content-type": _response2.headers.get("content-type") };
	const req2 = new Request({ headers: headers2 });
	_response2.arrayBuffer().then((buf) => req2.end(Buffer.from(buf)));

	await assert.rejects(
		h.handler(req2, "anton", "pkg", "fuzz", "1.0.2"),
		HttpError.Conflict,
		"re-uploading the same version should be rejected once eik.json is committed",
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

test("pkg.put() - infrastructure error reading versions index propagates as 502 and does not overwrite version history", async () => {
	// Regression test: _readVersions previously caught ALL errors and fell
	// back to treating the package as brand new, causing _writeVersions to
	// overwrite versions.json with only the new version and silently erase
	// all prior version history. A transient sink error (e.g. GCS 500)
	// during the read was sufficient to trigger this.
	const inner = new Sink();
	inner.set(
		"/local/pkg/fuzz/versions.json",
		JSON.stringify({
			versions: [[1, { version: "1.0.8", integrity: "sha512-existinghash" }]],
			type: "pkg",
			name: "fuzz",
			org: "local",
		}),
	);

	// Wrap the sink so that exist() resolves (the file is present) but
	// read() throws a generic infrastructure error for versions.json.
	const faultySink = {
		write: inner.write.bind(inner),
		read: (/** @type {string} */ filePath) => {
			if (filePath === "/local/pkg/fuzz/versions.json") {
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
		h.handler(req, "anton", "pkg", "fuzz", "1.0.9"),
		HttpError.BadGateway,
		"should reject with 502 when the versions index cannot be read",
	);

	// The original versions.json content must be unchanged.
	const raw = inner.get("/local/pkg/fuzz/versions.json");
	const parsed = JSON.parse(/** @type {string} */ (raw));
	assert.strictEqual(
		parsed.versions[0][0],
		1,
		"existing version history should be preserved",
	);
});

test("pkg.put() - eik.json is included in the package file list after upload", async () => {
	// Regression: PR #632 moved eik.json from being extracted through the
	// normal _persistFile path (which records the asset) to being written
	// server-side after the upload. The server-written eik.json was not
	// added to the package asset list, so it disappeared from the files
	// returned in {version}.package.json.
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

	await h.handler(req, "anton", "pkg", "fuzz", "8.4.1");

	// The package metadata file records all assets including eik.json.
	const raw = sink.get("/local/pkg/fuzz/8.4.1.package.json");
	assert.ok(raw !== null, "package metadata file should be written to sink");

	const meta = JSON.parse(/** @type {string} */ (raw));
	const filePathnames = meta.files.map((/** @type {any} */ f) => f.pathname);

	assert.ok(
		filePathnames.includes("/eik.json"),
		`eik.json should be listed in package files, got: ${JSON.stringify(filePathnames)}`,
	);
});
