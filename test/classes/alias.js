import { test } from "node:test";
import assert from "node:assert/strict";
import Alias from "../../lib/classes/alias.js";

test("Alias() - Object type", () => {
	const obj = new Alias();
	assert.strictEqual(
		Object.prototype.toString.call(obj),
		"[object Alias]",
		"should be Alias",
	);
});

test("Alias() - Default property values", () => {
	const obj = new Alias();
	assert.strictEqual(obj.version, "", ".version should be empty String");
	assert.strictEqual(obj.alias, "", ".alias should be empty String");
	assert.strictEqual(obj.name, "", ".name should be empty String");
	assert.strictEqual(obj.type, "", ".type should be empty String");
	assert.strictEqual(obj.org, "", ".org should be empty String");
});

test("Alias() - Set values to the arguments on the constructor", () => {
	const obj = new Alias({
		alias: "v1",
		name: "buzz",
		type: "pkg",
		org: "bizz",
	});
	assert.strictEqual(obj.version, "", ".version should be empty String");
	assert.strictEqual(
		obj.alias,
		"v1",
		".alias should contain value set on constructor",
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
	assert.strictEqual(
		obj.org,
		"bizz",
		".org should contain value set on constructor",
	);
});

test("Alias() - Set a value on the .version property", () => {
	const obj = new Alias();
	obj.version = "2.0.0";
	assert.strictEqual(
		obj.version,
		"2.0.0",
		".version should be value set on .version",
	);
});

test("Alias() - Serialize object", () => {
	const obj = new Alias({
		alias: "v1",
		name: "buzz",
		type: "pkg",
		org: "bizz",
	});
	obj.version = "2.0.0";

	const o = JSON.parse(JSON.stringify(obj));

	assert.strictEqual(
		o.version,
		"2.0.0",
		".version should be value set on .version",
	);
	assert.strictEqual(
		o.alias,
		"v1",
		".alias should contain value set on constructor",
	);
	assert.strictEqual(
		o.name,
		"buzz",
		".name should contain value set on constructor",
	);
	assert.strictEqual(
		o.type,
		"pkg",
		".type should contain value set on constructor",
	);
	assert.strictEqual(
		o.org,
		"bizz",
		".org should contain value set on constructor",
	);
});
