import { PassThrough } from "node:stream";
import HttpError from "http-errors";
import { URL } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import Sink from "@eik/sink-memory";

import MultipartParser from "../../lib/multipart/parser.js";
import HttpIncoming from "../../lib/classes/http-incoming.js";

const RE_UNEXPECTED_END_OF_FORM = /Unexpected end of form/;

const FIXTURE_TAR = new URL("../../fixtures/package.tar", import.meta.url);
const FIXTURE_BZ2 = new URL("../../fixtures/package.tar.bz2", import.meta.url);
const FIXTURE_GZ = new URL("../../fixtures/package.tar.gz", import.meta.url);
const FIXTURE_PKG = new URL("../../fixtures/archive.tgz", import.meta.url);

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
