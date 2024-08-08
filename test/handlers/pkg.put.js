import { PassThrough } from "node:stream";
import FormData from "form-data";
import HttpError from "http-errors";
import { URL } from "node:url";
import tap from "tap";
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

tap.test("pkg.put() - Allow publishing of previous version", async (t) => {
	const sink = new Sink();
	sink.set("/local/pkg/fuzz/1.0.1/eik.json", "payload");
	sink.set("/local/pkg/fuzz/1.0.3/eik.json", "payload");

	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append("package", fs.createReadStream(FIXTURE_TAR));

	const headers = formData.getHeaders();
	const req = new Request({ headers });
	formData.pipe(req);

	const res = await h.handler(req, "anton", "pkg", "fuzz", "1.0.2");
	t.equal(res.cacheControl, "no-store", '.cacheControl should be "no-store"');
	t.equal(res.statusCode, 303, '.statusCode should be "303"');
	t.equal(res.mimeType, "text/plain", '.mimeType should be "text/plain"');
	t.equal(
		res.location,
		"/pkg/fuzz/1.0.2",
		'.location should be "/pkg/fuzz/1.0.2"',
	);
	t.end();
});

tap.test("pkg.put() - Reject publishing of same version", (t) => {
	const sink = new Sink();
	sink.set("/local/pkg/fuzz/8.4.1/eik.json", "payload");

	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append("package", fs.createReadStream(FIXTURE_TAR));

	const headers = formData.getHeaders();
	const req = new Request({ headers });
	formData.pipe(req);

	t.rejects(
		h.handler(req, "anton", "pkg", "fuzz", "8.4.1"),
		new HttpError.Conflict(),
		"should reject with conflict error. Version already exists",
	);
	t.end();
});

tap.test('pkg.put() - The "type" argument is invalid', (t) => {
	const h = new Handler();
	t.rejects(
		h.handler({}, "anton", "zaaap", "fuzz", "8.4.1"),
		new HttpError.BadRequest(),
		"should reject with bad request error",
	);
	t.end();
});

tap.test('pkg.put() - The "name" argument is invalid', (t) => {
	const h = new Handler();
	t.rejects(
		h.handler({}, "anton", "pkg", null, "8.4.1"),
		new HttpError.BadRequest(),
		"should reject with bad request error",
	);
	t.end();
});

tap.test('pkg.put() - The "version" argument is invalid', (t) => {
	const h = new Handler();
	t.rejects(
		h.handler({}, "anton", "pkg", "fuzz", "zaaap"),
		new HttpError.BadRequest(),
		"should reject with bad request error",
	);
	t.end();
});

tap.test("pkg.put() - Successful upload of .tar file", async (t) => {
	const sink = new Sink();
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append("package", fs.createReadStream(FIXTURE_TAR));

	const headers = formData.getHeaders();
	const req = new Request({ headers });
	formData.pipe(req);

	const res = await h.handler(req, "anton", "pkg", "fuzz", "8.4.1");

	t.equal(res.cacheControl, "no-store", '.cacheControl should be "no-store"');
	t.equal(res.statusCode, 303, '.statusCode should be "303"');
	t.equal(res.mimeType, "text/plain", '.mimeType should be "text/plain"');
	t.equal(
		res.location,
		"/pkg/fuzz/8.4.1",
		'.location should be "/pkg/fuzz/8.4.1"',
	);
	t.end();
});

tap.test("pkg.put() - URL parameters is URL encoded", async (t) => {
	const sink = new Sink();
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append("package", fs.createReadStream(FIXTURE_TAR));

	const headers = formData.getHeaders();
	const req = new Request({ headers });
	formData.pipe(req);

	const res = await h.handler(
		req,
		"anton",
		"pkg",
		"%40foo%2Fbar-lib",
		"8%2E1%2E4%2D1",
	);

	t.equal(res.statusCode, 303, "should respond with expected status code");
	t.equal(
		res.location,
		"/pkg/@foo/bar-lib/8.1.4-1",
		".location should be decoded",
	);
	t.end();
});

tap.test("pkg.put() - Successful upload of .tar.gz file", async (t) => {
	const sink = new Sink();
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append("package", fs.createReadStream(FIXTURE_GZ));

	const headers = formData.getHeaders();
	const req = new Request({ headers });
	formData.pipe(req);

	const res = await h.handler(req, "anton", "pkg", "fuzz", "8.4.1");

	t.equal(res.cacheControl, "no-store", '.cacheControl should be "no-store"');
	t.equal(res.statusCode, 303, '.statusCode should be "303"');
	t.equal(res.mimeType, "text/plain", '.mimeType should be "text/plain"');
	t.equal(
		res.location,
		"/pkg/fuzz/8.4.1",
		'.location should be "/pkg/fuzz/8.4.1"',
	);
	t.end();
});

tap.test("pkg.put() - File is not a tar file", (t) => {
	const sink = new Sink();
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append("package", fs.createReadStream(FIXTURE_MAP));

	const headers = formData.getHeaders();
	const req = new Request({ headers });
	formData.pipe(req);

	t.rejects(
		h.handler(req, "anton", "pkg", "fuzz", "8.4.1"),
		new HttpError.UnsupportedMediaType(),
		"should reject with unsupported media type error",
	);
	t.end();
});

tap.test(
	"pkg.put() - File is not a compatible file or contain an error",
	(t) => {
		const sink = new Sink();
		const h = new Handler({ sink });

		const formData = new FormData();
		formData.append("package", fs.createReadStream(FIXTURE_BZ2));

		const headers = formData.getHeaders();
		const req = new Request({ headers });
		formData.pipe(req);

		t.rejects(
			h.handler(req, "anton", "pkg", "fuzz", "8.4.1"),
			new HttpError.UnprocessableEntity(),
			"should reject with unprocessable entry error",
		);
		t.end();
	},
);

tap.test("pkg.put() - Form field is not valid", (t) => {
	const sink = new Sink();
	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append("pkg", fs.createReadStream(FIXTURE_PKG));

	const headers = formData.getHeaders();
	const req = new Request({ headers });
	formData.pipe(req);

	t.rejects(
		h.handler(req, "anton", "pkg", "fuzz", "8.4.1"),
		new HttpError.BadRequest(),
		"should reject with bad request error",
	);
	t.end();
});

tap.test("pkg.put() - File exceeds legal file size limit", (t) => {
	const sink = new Sink();
	const h = new Handler({
		pkgMaxFileSize: 100,
		sink,
	});

	const formData = new FormData();
	formData.append("package", fs.createReadStream(FIXTURE_PKG));

	const headers = formData.getHeaders();
	const req = new Request({ headers });
	formData.pipe(req);

	t.rejects(
		h.handler(req, "anton", "pkg", "fuzz", "8.4.1"),
		new HttpError.PayloadTooLarge(),
		"should reject with payload too large error",
	);
	t.end();
});
