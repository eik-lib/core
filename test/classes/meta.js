import { test } from "node:test";
import assert from "node:assert/strict";
import Meta from "../../lib/classes/meta.js";

test("Meta() - Object type", () => {
	const obj = new Meta();
	assert.strictEqual(
		Object.prototype.toString.call(obj),
		"[object Meta]",
		"should be Meta",
	);
});

test("Meta() - Default property values", () => {
	const obj = new Meta();
	assert.strictEqual(obj.value, "", ".value should be empty String");
	assert.strictEqual(obj.name, "", ".name should be empty String");
});

test("Meta() - Set arguments on the constructor", () => {
	const obj = new Meta({ value: "foo", name: "bar" });
	assert.strictEqual(obj.value, "foo", ".value should be the set value");
	assert.strictEqual(obj.name, "bar", ".name should be the set value");
});

test("Meta() - Serialize object", () => {
	const obj = new Meta({ value: "foo", name: "bar" });

	const o = JSON.parse(JSON.stringify(obj));

	assert.strictEqual(o.value, "foo", ".value should be the set value");
	assert.strictEqual(o.name, "bar", ".name should be the set value");
});
