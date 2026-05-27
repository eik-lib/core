import { Readable } from "node:stream";
import { test } from "node:test";
import assert from "node:assert/strict";
import HttpOutgoing from "../../lib/classes/http-outgoing.js";

const RE_ILLEGAL_STATUS_CODE = /Value is not a legal http status code/;
const RE_NOT_READABLE_STREAM = /Value is not a Readable stream/;

test("HttpOutgoing() - Object type", () => {
	const obj = new HttpOutgoing();
	assert.strictEqual(
		Object.prototype.toString.call(obj),
		"[object HttpOutgoing]",
		"should be HttpIncoming",
	);
});

test("HttpOutgoing() - Default property values", () => {
	const obj = new HttpOutgoing();
	assert.strictEqual(
		obj.statusCode,
		200,
		".statusCode should be the Number 200",
	);
	assert.strictEqual(obj.location, "", ".location should be empty String");
	assert.strictEqual(
		obj.mimeType,
		"text/plain",
		'.mimeType should be the String "text/plain"',
	);
	assert.strictEqual(
		typeof obj.stream,
		"undefined",
		".stream should be undefined",
	);
	assert.strictEqual(typeof obj.body, "undefined", ".body should be undefined");
	assert.strictEqual(obj.etag, "", ".etag should be empty String");
});

test("HttpOutgoing() - Set .statusCode to legal value", () => {
	const obj = new HttpOutgoing();
	obj.statusCode = 404;
	assert.strictEqual(
		obj.statusCode,
		404,
		".statusCode should be the set value",
	);
});

test("HttpOutgoing() - Set .statusCode to non numeric value", () => {
	assert.throws(
		() => {
			const obj = new HttpOutgoing();
			// @ts-expect-error Testing bad input
			obj.statusCode = "fouronefour";
		},
		RE_ILLEGAL_STATUS_CODE,
		"Should throw",
	);
});

test("HttpOutgoing() - Set .statusCode to a illegal http status code", () => {
	assert.throws(
		() => {
			const obj = new HttpOutgoing();
			obj.statusCode = 98555555;
		},
		RE_ILLEGAL_STATUS_CODE,
		"Should throw",
	);
});

test("HttpOutgoing() - Set .location to legal value", () => {
	const obj = new HttpOutgoing();
	obj.location = "/foo";
	assert.strictEqual(obj.location, "/foo", ".location should be the set value");
});

test("HttpOutgoing() - Set .mimeType to legal value", () => {
	const obj = new HttpOutgoing();
	obj.mimeType = "text/javascript";
	assert.strictEqual(
		obj.mimeType,
		"text/javascript",
		".location should be the set value",
	);
});

test("HttpOutgoing() - Set .stream to legal value", () => {
	const obj = new HttpOutgoing();
	obj.stream = new Readable();
	assert.ok(obj.stream instanceof Readable, ".stream should be the set value");
});

test("HttpOutgoing() - Set a non Readable stream as value on the .stream property", () => {
	assert.throws(
		() => {
			const obj = new HttpOutgoing();
			obj.stream = /** @type {any} */ ("foo");
		},
		RE_NOT_READABLE_STREAM,
		"Should throw",
	);
});

test("HttpOutgoing() - Set .body to legal value", () => {
	const obj = new HttpOutgoing();
	obj.body = "foo";
	assert.strictEqual(obj.body, "foo", ".location should be the set value");
});

test("HttpOutgoing() - Set .etag to legal value", () => {
	const obj = new HttpOutgoing();
	obj.etag = "foo";
	assert.strictEqual(obj.etag, "foo", ".location should be the set value");
});
