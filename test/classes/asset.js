import { test } from "node:test";
import assert from "node:assert/strict";
import Asset from "../../lib/classes/asset.js";

test("HttpIncoming() - Object type", () => {
	const obj = new Asset();
	assert.strictEqual(
		Object.prototype.toString.call(obj),
		"[object Asset]",
		"should be Asset",
	);
});

test("Asset() - Default property values", () => {
	const obj = new Asset();
	assert.strictEqual(obj.integrity, "", ".integrity should be empty String");
	assert.strictEqual(obj.pathname, "/", '.pathname should be "/"');
	assert.strictEqual(
		obj.mimeType,
		"application/octet-stream",
		'.mimetype should be "application/octet-stream"',
	);
	assert.strictEqual(obj.version, "", ".version should be empty String");
	assert.strictEqual(obj.asset, "/", '.asset should be "/"');
	assert.strictEqual(obj.name, "", ".name should be empty String");
	assert.strictEqual(obj.type, "", ".type should be empty String");
	assert.strictEqual(obj.size, -1, ".size should be the number -1");
	assert.strictEqual(obj.org, "", ".org should be empty String");
});

test("Asset() - Set values to the arguments on the constructor", () => {
	const obj = new Asset({
		pathname: "/foo/bar.js",
		version: "4.2.6",
		name: "buzz",
		type: "pkg",
		org: "bizz",
	});
	assert.strictEqual(obj.integrity, "", ".integrity should be empty String");
	assert.strictEqual(
		obj.pathname,
		"/foo/bar.js",
		".pathname should contain value set on constructor",
	);
	assert.strictEqual(
		obj.mimeType,
		"text/javascript",
		'.mimeType should contain value matching type of file set on "pathname"',
	);
	assert.strictEqual(
		obj.version,
		"4.2.6",
		".version should contain value set on constructor",
	);
	assert.strictEqual(
		obj.asset,
		"/foo/bar.js",
		'.asset should contain same value as set on "pathname" on constructor',
	);
	assert.strictEqual(
		obj.name,
		"buzz",
		".name should contain value set on constructor",
	);
	assert.strictEqual(
		obj.type,
		"pkg",
		".type should contain value set on constructor",
	);
	assert.strictEqual(obj.size, -1, ".size should be the number -1");
	assert.strictEqual(
		obj.org,
		"bizz",
		".org should contain value set on constructor",
	);
});

test('Asset() - Set values to the argument "type" on the constructor in upper case', () => {
	const obj = new Asset({
		type: "PkG",
	});
	assert.strictEqual(
		obj.type,
		"pkg",
		".type should contain value set on property in lower case",
	);
});

test("Asset() - Set .integrity property", () => {
	const obj = new Asset();
	obj.integrity = "foo";
	assert.strictEqual(
		obj.integrity,
		"foo",
		".integrity should contain value set on property",
	);
});

test("Asset() - Set .type property", () => {
	const obj = new Asset();
	obj.type = "pkg";
	assert.strictEqual(
		obj.type,
		"pkg",
		".type should contain value set on property",
	);
});

test("Asset() - Set .type property with upper case characthers", () => {
	const obj = new Asset();
	obj.type = "PkG";
	assert.strictEqual(
		obj.type,
		"pkg",
		".type should contain value set on property in lower case",
	);
});

test("Asset() - Set .size property", () => {
	const obj = new Asset();
	obj.size = 1234;
	assert.strictEqual(
		obj.size,
		1234,
		".size should contain value set on property",
	);
});

test("Asset() - Stringify object to JSON", () => {
	const obj = new Asset({
		pathname: "/foo/bar.js",
		version: "4.2.6",
		name: "buzz",
		type: "pkg",
		org: "bizz",
	});
	obj.integrity = "foo";
	obj.size = 1234;

	const o = JSON.parse(JSON.stringify(obj));

	assert.strictEqual(
		o.integrity,
		"foo",
		".integrity should contain value set on origin object",
	);
	assert.strictEqual(
		o.pathname,
		"/foo/bar.js",
		".pathname should contain value set on origin object",
	);
	assert.strictEqual(
		o.mimeType,
		"text/javascript",
		'.mimeType should contain value matching type of file set on "pathname" on the origin object',
	);
	assert.strictEqual(
		o.type,
		"pkg",
		".type should contain value set on origin object",
	);
	assert.strictEqual(
		o.size,
		1234,
		".size should contain value set on origin object",
	);
});
