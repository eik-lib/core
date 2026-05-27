import { test } from "node:test";
import assert from "node:assert/strict";
import Versions from "../../lib/classes/versions.js";

test("Versions() - Object type", () => {
	const obj = new Versions();
	assert.strictEqual(
		Object.prototype.toString.call(obj),
		"[object Versions]",
		"should be Versions",
	);
});

test("Versions() - Default property values", () => {
	const obj = new Versions();
	assert.deepStrictEqual(obj.versions, [], ".version should be empty Array");
	assert.strictEqual(obj.name, "", ".name should be empty String");
	assert.strictEqual(obj.org, "", ".org should be empty String");
});

test('Versions() - Set a value on the "name" argument on the constructor', () => {
	const obj = new Versions({ name: "foo" });
	assert.strictEqual(
		obj.name,
		"foo",
		".name should be value set on constructor",
	);
});

test('Versions() - Set a value on the "org" argument on the constructor', () => {
	const obj = new Versions({ org: "bar" });
	assert.strictEqual(obj.org, "bar", ".org should be value set on constructor");
});

test("Versions() - Set the multiple versions in the same major range", () => {
	const obj = new Versions();
	obj.setVersion("4.3.2", "bar");
	obj.setVersion("4.6.1", "foo");
	assert.deepStrictEqual(
		obj.versions,
		[[4, { integrity: "foo", version: "4.6.1" }]],
		".versions should have only one major version",
	);
});

test("Versions() - Set multiple versions with different major range", () => {
	const obj = new Versions();
	obj.setVersion("1.7.3", "rab");
	obj.setVersion("3.3.2", "bar");
	obj.setVersion("4.6.1", "foo");
	obj.setVersion("2.6.9", "xyz");
	assert.deepStrictEqual(
		obj.versions,
		[
			[4, { integrity: "foo", version: "4.6.1" }],
			[3, { integrity: "bar", version: "3.3.2" }],
			[2, { integrity: "xyz", version: "2.6.9" }],
			[1, { integrity: "rab", version: "1.7.3" }],
		],
		".versions should have multiple major version in sorted order",
	);
});

test("Versions() - Get a version", () => {
	const obj = new Versions();
	obj.setVersion("4.2.4", "xyz");
	obj.setVersion("4.3.2", "bar");
	obj.setVersion("3.6.1", "foo");

	const v3 = obj.getVersion(3);
	const v4 = obj.getVersion(4);

	assert.deepStrictEqual(
		v3,
		{ integrity: "foo", version: "3.6.1" },
		"should match values set by .setVersion()",
	);
	assert.deepStrictEqual(
		v4,
		{ integrity: "bar", version: "4.3.2" },
		"should match values set by .setVersion()",
	);
});

test("Versions() - Set values to the arguments on the constructor", () => {
	const obj = new Versions({ name: "buzz", org: "bizz" });
	obj.setVersion("1.7.3", "rab");
	obj.setVersion("3.3.2", "bar");
	obj.setVersion("4.6.1", "foo");
	obj.setVersion("2.6.9", "xyz");

	const serialized = JSON.parse(JSON.stringify(obj));
	const o = new Versions(serialized);

	assert.strictEqual(
		o.name,
		obj.name,
		".name should be same as in original object",
	);
	assert.strictEqual(
		o.org,
		obj.org,
		".org should be same as in original object",
	);

	assert.deepStrictEqual(
		o.versions,
		[
			[4, { integrity: "foo", version: "4.6.1" }],
			[3, { integrity: "bar", version: "3.3.2" }],
			[2, { integrity: "xyz", version: "2.6.9" }],
			[1, { integrity: "rab", version: "1.7.3" }],
		],
		".versions should have multiple major version in sorted order",
	);

	const v3 = o.getVersion(3);
	const v4 = o.getVersion(4);

	assert.deepStrictEqual(
		v3,
		{ integrity: "bar", version: "3.3.2" },
		"should match values set by .setVersion() on the original object",
	);
	assert.deepStrictEqual(
		v4,
		{ integrity: "foo", version: "4.6.1" },
		"should match values set by .setVersion() on the original object",
	);
});
