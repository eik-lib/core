import { test } from "node:test";
import assert from "node:assert/strict";
import FormField from "../../lib/multipart/form-field.js";

test("FormField() - Object type", () => {
	const obj = new FormField();
	assert.strictEqual(
		Object.prototype.toString.call(obj),
		"[object FormField]",
		"should be FormField",
	);
});

test("FormField() - Default constructor values", () => {
	const obj = new FormField();
	assert.strictEqual(obj.name, "", ".name should be empty String");
	assert.strictEqual(obj.value, "", ".value should be empty String");
});

test("FormField() - Custom constructor values", () => {
	const obj = new FormField({ name: "foo", value: "bar" });
	assert.strictEqual(
		obj.name,
		"foo",
		".name should have value from constructor",
	);
	assert.strictEqual(
		obj.value,
		"bar",
		".value should have value from constructor",
	);
});

test("FormField() - .toJSON", () => {
	const obj = new FormField({ name: "foo", value: "bar" });
	const o = JSON.parse(JSON.stringify(obj));
	assert.deepStrictEqual(
		o,
		{ name: "foo", value: "bar" },
		"should stringify object",
	);
});
