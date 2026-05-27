import { test } from "node:test";
import assert from "node:assert/strict";
import FormFile from "../../lib/multipart/form-file.js";

const RE_VALUE_MUST_BE_ARRAY = /The argument "value" must be of type Array/;

test("FormFile() - Object type", () => {
	const obj = new FormFile();
	assert.strictEqual(
		Object.prototype.toString.call(obj),
		"[object FormFile]",
		"should be FormFile",
	);
});

test("FormFile() - Default constructor values", () => {
	const obj = new FormFile();
	assert.strictEqual(obj.name, "", ".name should be empty String");
	assert.deepStrictEqual(obj.value, [], ".value should be empty Array");
});

test("FormFile() - Custom constructor values", () => {
	const obj = new FormFile({ name: "foo", value: ["bar"] });
	assert.strictEqual(
		obj.name,
		"foo",
		".name should have value from constructor",
	);
	assert.deepStrictEqual(
		obj.value,
		["bar"],
		".value should have value from constructor",
	);
});

test("FormFile() - Constructor value is illegal", () => {
	assert.throws(
		() => {
			// @ts-expect-error Testing bad input
			// eslint-disable-next-line no-unused-vars
			const obj = new FormFile({ name: "foo", value: "bar" });
		},
		RE_VALUE_MUST_BE_ARRAY,
		"Should throw",
	);
});

test("FormFile() - .toJSON", () => {
	const obj = new FormFile({ name: "foo", value: ["bar"] });
	const o = JSON.parse(JSON.stringify(obj));
	assert.deepStrictEqual(
		o,
		{ name: "foo", value: ["bar"] },
		"should stringify object",
	);
});
