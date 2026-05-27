import { test } from "node:test";
import assert from "node:assert/strict";
import HttpIncoming from "../../lib/classes/http-incoming.js";

test("HttpIncoming() - Object type", () => {
	const obj = new HttpIncoming();
	assert.strictEqual(
		Object.prototype.toString.call(obj),
		"[object HttpIncoming]",
		"should be HttpIncoming",
	);
});

test("HttpIncoming() - Default property values", () => {
	const obj = new HttpIncoming();
	assert.strictEqual(
		typeof obj.request,
		"undefined",
		".request should be undefined",
	);
	assert.deepStrictEqual(obj.headers, {}, ".headers should be empty Object");
	assert.strictEqual(obj.version, "", ".version should be empty String");
	assert.strictEqual(obj.extras, "", ".extras should be empty String");
	assert.strictEqual(obj.alias, "", ".alias should be empty String");
	assert.strictEqual(obj.type, "", ".type should be empty String");
	assert.strictEqual(obj.name, "", ".name should be empty String");
	assert.strictEqual(obj.org, "", ".org should be empty String");
});

test("HttpIncoming() - Set values to the arguments on the constructor", () => {
	const obj = new HttpIncoming(
		{
			headers: {
				foo: "bar",
			},
		},
		{
			version: "1.0.0",
			extras: "/foo",
			alias: "v1",
			name: "buzz",
			type: "pkg",
			org: "bizz",
		},
	);
	assert.strictEqual(
		typeof obj.request,
		"object",
		".request should contain value set on constructor",
	);
	assert.deepStrictEqual(
		obj.headers,
		{ foo: "bar" },
		".headers should be the headers from the request argument",
	);
	assert.strictEqual(
		obj.version,
		"1.0.0",
		".version should contain value set on constructor",
	);
	assert.strictEqual(
		obj.extras,
		"/foo",
		".extras should contain value set on constructor",
	);
	assert.strictEqual(
		obj.alias,
		"v1",
		".alias should contain value set on constructor",
	);
	assert.strictEqual(
		obj.type,
		"pkg",
		".type should contain value set on constructor",
	);
	assert.strictEqual(
		obj.name,
		"buzz",
		".name should contain value set on constructor",
	);
	assert.strictEqual(
		obj.org,
		"bizz",
		".org should contain value set on constructor",
	);
});
