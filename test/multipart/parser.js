import { PassThrough, Writable } from "node:stream";
import HttpError from "http-errors";
import { URL } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import Sink from "@eik/sink-memory";
import SinkTest from "../../lib/sinks/test.js";

import MultipartParser from "../../lib/multipart/parser.js";
import HttpIncoming from "../../lib/classes/http-incoming.js";

const RE_UNEXPECTED_END_OF_FORM = /Unexpected end of form/;

const FIXTURE_TAR = new URL("../../fixtures/package.tar", import.meta.url);
const FIXTURE_BZ2 = new URL("../../fixtures/package.tar.bz2", import.meta.url);
const FIXTURE_GZ = new URL("../../fixtures/package.tar.gz", import.meta.url);
const FIXTURE_PKG = new URL("../../fixtures/archive.tgz", import.meta.url);
const FIXTURE_SMALL_PKG = new URL(
	"../../fixtures/archive-small.tgz",
	import.meta.url,
);
const FIXTURE_WITH_EIK_JSON = new URL(
	"../../fixtures/archive-with-eik-json.tgz",
	import.meta.url,
);
const FIXTURE_MANY_FILES = new URL(
	"../../fixtures/archive-many-files.tgz",
	import.meta.url,
);

const Request = class Request extends PassThrough {
	constructor({ headers = {} } = {}) {
		super();
		this.headers = { host: "localhost", ...headers };
	}
};

test("Parser() - Object type", () => {
	const obj = new MultipartParser();
	assert.strictEqual(
		Object.prototype.toString.call(obj),
		"[object MultipartParser]",
		"should be MultipartParser",
	);
});

test("Parser() - Request contains multiple files and fields", async (t) => {
	const multipart = new MultipartParser({
		legalFields: ["foo", "bar"],
		legalFiles: ["tgz", "tar"],
		sink: new Sink(),
	});

	const formData = new FormData();
	formData.append(
		"tgz",
		new Blob([fs.readFileSync(FIXTURE_GZ)], {
			type: "application/octet-stream",
		}),
		"package.tar.gz",
	);
	formData.append("foo", "value-foo");
	formData.append("bar", "value-bar");
	formData.append(
		"tar",
		new Blob([fs.readFileSync(FIXTURE_TAR)], {
			type: "application/octet-stream",
		}),
		"package.tar",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	const incoming = new HttpIncoming(req, {
		version: "1.1.1",
		author: {},
		type: "pkg",
		name: "buz",
		org: "biz",
	});

	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	const result = await multipart.parse(incoming);

	t.assert.snapshot(result);
});

test("Parser() - Request contains only files", async (t) => {
	const multipart = new MultipartParser({
		legalFiles: ["tgz", "tar"],
		sink: new Sink(),
	});

	const formData = new FormData();
	formData.append(
		"tgz",
		new Blob([fs.readFileSync(FIXTURE_GZ)], {
			type: "application/octet-stream",
		}),
		"package.tar.gz",
	);
	formData.append(
		"tar",
		new Blob([fs.readFileSync(FIXTURE_TAR)], {
			type: "application/octet-stream",
		}),
		"package.tar",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	const incoming = new HttpIncoming(req, {
		version: "1.1.1",
		author: {},
		type: "pkg",
		name: "buz",
		org: "biz",
	});

	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	const result = await multipart.parse(incoming);

	t.assert.snapshot(result);
});

test("Parser() - Request contains only fields", async (t) => {
	const multipart = new MultipartParser({
		legalFields: ["foo", "bar"],
		sink: new Sink(),
	});

	const formData = new FormData();
	formData.append("foo", "value-foo");
	formData.append("bar", "value-bar");

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	const incoming = new HttpIncoming(req, {
		version: "1.1.1",
		author: {},
		type: "pkg",
		name: "buz",
		org: "biz",
	});

	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	const result = await multipart.parse(incoming);

	t.assert.snapshot(result);
});

test("Parser() - Request is empty", async () => {
	const multipart = new MultipartParser({
		legalFields: ["foo", "bar"],
		legalFiles: ["tgz", "tar"],
		sink: new Sink(),
	});

	// Use a content-type with a boundary but send no body so busboy
	// receives an incomplete multipart stream and rejects as expected.
	const headers = {
		"content-type": "multipart/form-data; boundary=----formdata-empty-0000",
	};
	const req = new Request({ headers });
	const incoming = new HttpIncoming(req, {
		version: "1.1.1",
		author: {},
		type: "pkg",
		name: "buz",
		org: "biz",
	});

	req.end();

	await assert.rejects(
		multipart.parse(incoming),
		RE_UNEXPECTED_END_OF_FORM,
		"should reject with orignal error",
	);
});

test("Parser() - Request contain illegal field name", async () => {
	const multipart = new MultipartParser({
		legalFields: ["foo", "bar"],
		sink: new Sink(),
	});

	const formData = new FormData();
	formData.append("foo", "value-foo");
	formData.append("xyz", "value-xyz");

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	const incoming = new HttpIncoming(req, {
		version: "1.1.1",
		author: {},
		type: "pkg",
		name: "buz",
		org: "biz",
	});

	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	await assert.rejects(
		multipart.parse(incoming),
		HttpError.BadRequest,
		"should reject with bad request error",
	);
});

test("Parser() - Request contain illegal file name", async () => {
	const multipart = new MultipartParser({
		legalFiles: ["tgz", "tar"],
		sink: new Sink(),
	});

	const formData = new FormData();
	formData.append(
		"tgz",
		new Blob([fs.readFileSync(FIXTURE_GZ)], {
			type: "application/octet-stream",
		}),
		"package.tar.gz",
	);
	formData.append(
		"xyz",
		new Blob([fs.readFileSync(FIXTURE_TAR)], {
			type: "application/octet-stream",
		}),
		"package.tar",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	const incoming = new HttpIncoming(req, {
		version: "1.1.1",
		author: {},
		type: "pkg",
		name: "buz",
		org: "biz",
	});

	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	await assert.rejects(
		multipart.parse(incoming),
		HttpError.BadRequest,
		"should reject with bad request error",
	);
});

test("Parser() - Request contain unprocessable file", async () => {
	const multipart = new MultipartParser({
		legalFiles: ["file"],
		sink: new Sink(),
	});

	const formData = new FormData();
	formData.append(
		"file",
		new Blob([fs.readFileSync(FIXTURE_BZ2)], {
			type: "application/octet-stream",
		}),
		"package.tar.bz2",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	const incoming = new HttpIncoming(req, {
		version: "1.1.1",
		author: {},
		type: "pkg",
		name: "buz",
		org: "biz",
	});

	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	await assert.rejects(
		multipart.parse(incoming),
		HttpError.UnprocessableEntity,
		"should reject with unprocessable entity error",
	);
});

test("Parser() - Request contain file which is too large", async () => {
	const multipart = new MultipartParser({
		pkgMaxFileSize: 1024,
		legalFiles: ["large", "small"],
		sink: new Sink(),
	});

	const formData = new FormData();
	formData.append(
		"small",
		new Blob([fs.readFileSync(FIXTURE_GZ)], {
			type: "application/octet-stream",
		}),
		"package.tar.gz",
	);
	formData.append(
		"large",
		new Blob([fs.readFileSync(FIXTURE_PKG)], {
			type: "application/octet-stream",
		}),
		"archive.tgz",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	const incoming = new HttpIncoming(req, {
		version: "1.1.1",
		author: {},
		type: "pkg",
		name: "buz",
		org: "biz",
	});

	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	await assert.rejects(
		multipart.parse(incoming),
		HttpError.PayloadTooLarge,
		"should reject with payload too large error",
	);
});

test("Parser() - A warn log is emitted with package details when the file size limit is exceeded", async () => {
	let warnMessage = "";
	const logger = {
		fatal: () => {},
		error: () => {},
		warn: (/** @type {string} */ msg) => {
			warnMessage = msg;
		},
		info: () => {},
		debug: () => {},
		trace: () => {},
	};

	const multipart = new MultipartParser({
		pkgMaxFileSize: 1024,
		legalFiles: ["package"],
		sink: new Sink(),
		logger,
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
	const incoming = new HttpIncoming(req, {
		version: "2.0.0",
		author: {},
		type: "pkg",
		name: "my-app",
		org: "my-org",
	});

	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	await assert.rejects(
		multipart.parse(incoming),
		HttpError.PayloadTooLarge,
		"should reject with payload too large error",
	);

	assert.ok(
		warnMessage.includes("my-app"),
		"warn log should include the package name",
	);
	assert.ok(
		warnMessage.includes("2.0.0"),
		"warn log should include the package version",
	);
	assert.ok(
		warnMessage.includes("1024"),
		"warn log should include the configured size limit",
	);
});

test("Parser() - In-flight sink writes are aborted when file size limit is exceeded", async () => {
	const sink = new SinkTest();
	// Delay write() returning its stream so _persistFile calls are guaranteed
	// to be awaiting when the abort fires. This lets the test distinguish
	// between writes that were properly aborted (no data in sink) and writes
	// that completed unchecked (data present in sink).
	sink.writeDelayResolve = () => 20;

	const multipart = new MultipartParser({
		// archive-small.tgz is 1,093 bytes — set limit just below so the
		// file starts being processed before the limit event fires.
		pkgMaxFileSize: 1000,
		legalFiles: ["package"],
		sink,
	});

	const formData = new FormData();
	formData.append(
		"package",
		new Blob([fs.readFileSync(FIXTURE_SMALL_PKG)], {
			type: "application/octet-stream",
		}),
		"archive-small.tgz",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	const incoming = new HttpIncoming(req, {
		version: "1.0.0",
		author: {},
		type: "pkg",
		name: "test-pkg",
		org: "local",
	});

	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	await assert.rejects(
		multipart.parse(incoming),
		HttpError.PayloadTooLarge,
		"should reject with payload too large error",
	);

	// Wait longer than writeDelayResolve so that any write() calls that were
	// not aborted would have had time to return their stream, run the pipeline,
	// and fire the finish event that commits data to the sink.
	await new Promise((resolve) => setTimeout(resolve, 100));

	assert.strictEqual(
		sink.dump().length,
		0,
		"should not commit any asset writes to the sink when the upload is aborted",
	);
});

test("Parser() - eik.json in tar is captured on FormFile and not written to sink", async () => {
	const sink = new SinkTest();
	const multipart = new MultipartParser({
		legalFiles: ["package"],
		sink,
	});

	const formData = new FormData();
	formData.append(
		"package",
		new Blob([fs.readFileSync(FIXTURE_WITH_EIK_JSON)], {
			type: "application/octet-stream",
		}),
		"archive.tgz",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	const incoming = new HttpIncoming(req, {
		version: "1.1.1",
		author: {},
		type: "pkg",
		name: "buz",
		org: "biz",
	});

	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	const result = await multipart.parse(incoming);

	const formFile = result.find(
		(/** @type {any} */ item) => item.constructor.name === "FormFile",
	);

	assert.ok(formFile, "should have a FormFile result");
	assert.ok(
		formFile.eikJson !== null,
		"FormFile should have eikJson populated",
	);
	assert.strictEqual(
		formFile.eikJson.name,
		"test-pkg",
		"eikJson should contain the name field from the tar",
	);
	assert.strictEqual(
		formFile.eikJson.server,
		"http://localhost",
		"eikJson should contain the server field from the tar",
	);

	// eik.json must NOT be written to the sink — it is the handler's job
	// to write it server-side as the final committed marker.
	assert.strictEqual(
		sink.get("/biz/pkg/buz/1.1.1/eik.json"),
		null,
		"eik.json should not be written to the sink by the parser",
	);
});

test("Parser() - eikJson is null on FormFile when tar does not contain eik.json", async () => {
	const sink = new Sink();
	const multipart = new MultipartParser({
		legalFiles: ["package"],
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
	const incoming = new HttpIncoming(req, {
		version: "1.1.1",
		author: {},
		type: "pkg",
		name: "buz",
		org: "biz",
	});

	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	const result = await multipart.parse(incoming);

	const formFile = result.find(
		(/** @type {any} */ item) => item.constructor.name === "FormFile",
	);

	assert.ok(formFile, "should have a FormFile result");
	assert.strictEqual(
		formFile.eikJson,
		null,
		"eikJson should be null when the tar contains no eik.json",
	);
});

test("Parser() - second busboy error from concurrent file failure does not cause unhandled exception", async () => {
	// Regression test for the busboy.once("error") crash:
	// When an illegal field fires a first error (removing the .once listener)
	// and a concurrent _handleFile failure then tries to emit a second error,
	// there must be no zero-listener throw. The parse should reject cleanly
	// with the first error and the test process must not crash.
	const multipart = new MultipartParser({
		legalFields: ["foo"],
		legalFiles: ["file"],
		sink: new Sink(),
	});

	const formData = new FormData();
	// Illegal field comes first in the body — busboy processes it
	// synchronously, firing the first error and removing the .once listener.
	formData.append("xyz", "value");
	// The file uses an incompatible archive format so _handleFile will fail
	// asynchronously and emit a second error onto busboy.
	formData.append(
		"file",
		new Blob([fs.readFileSync(FIXTURE_BZ2)], {
			type: "application/octet-stream",
		}),
		"package.tar.bz2",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	const incoming = new HttpIncoming(req, {
		version: "1.1.1",
		author: {},
		type: "pkg",
		name: "buz",
		org: "biz",
	});

	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	await assert.rejects(
		multipart.parse(incoming),
		HttpError.BadRequest,
		"should reject with the first error (illegal field name)",
	);

	// Give any background file processing time to complete and emit its
	// second error — if that second error were unhandled it would crash the
	// process and this await would never resolve.
	await new Promise((resolve) => setTimeout(resolve, 50));
});

test("Parser() - _handleFile caps concurrent sink writes to avoid exhausting connections and file descriptors", async () => {
	// The concurrency cap inside _handleFile. This value must match the
	// MAX_CONCURRENT_WRITES constant in the implementation.
	const MAX_CONCURRENT_WRITES = 16;

	let activeWrites = 0;
	let peakActiveWrites = 0;

	// Simulates a real sink (e.g. GCS) where:
	//   - write() resolves immediately (just creates the upload stream object)
	//   - data drains through the stream without backpressure
	//   - but the stream stays "open" (final() is delayed) while data uploads
	//
	// This means multiple entries can be in-flight simultaneously, and the
	// peak active count reflects real concurrent open upload streams.
	const trackingSink = {
		write() {
			activeWrites++;
			if (activeWrites > peakActiveWrites) {
				peakActiveWrites = activeWrites;
			}
			return Promise.resolve(
				new Writable({
					write(chunk, _enc, cb) {
						// Accept data instantly — no backpressure — so the tar parser
						// can advance to the next entry before this one completes.
						cb();
					},
					final(cb) {
						// Delay completion to simulate an in-progress upload.
						// During this window other entries can dispatch and open
						// their own streams, making peak concurrency observable.
						setTimeout(() => {
							activeWrites--;
							cb();
						}, 20);
					},
				}),
			);
		},
		exist() {
			return Promise.resolve();
		},
		read() {
			return Promise.reject(new Error("not implemented"));
		},
		delete() {
			return Promise.resolve();
		},
	};

	const multipart = new MultipartParser({
		legalFiles: ["package"],
		sink: /** @type {any} */ (trackingSink),
	});

	// The fixture contains 30 files — well above the expected concurrency cap
	// of 16. Without the cap all 30 write() calls open simultaneously.
	const formData = new FormData();
	formData.append(
		"package",
		new Blob([fs.readFileSync(FIXTURE_MANY_FILES)], {
			type: "application/octet-stream",
		}),
		"archive.tgz",
	);

	const _response = new Response(formData);
	const headers = { "content-type": _response.headers.get("content-type") };
	const req = new Request({ headers });
	const incoming = new HttpIncoming(req, {
		version: "1.0.0",
		author: {},
		type: "pkg",
		name: "many-files",
		org: "test-org",
	});

	_response.arrayBuffer().then((buf) => req.end(Buffer.from(buf)));

	await multipart.parse(incoming);

	assert.ok(
		peakActiveWrites <= MAX_CONCURRENT_WRITES,
		`Peak concurrent sink writes (${peakActiveWrites}) exceeded the cap of ${MAX_CONCURRENT_WRITES}`,
	);
});
