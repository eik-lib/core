import { test } from "node:test";
import assert from "node:assert/strict";
import Author from "../../lib/classes/author.js";

test("Author() - Object type", () => {
	const obj = new Author();
	assert.strictEqual(
		Object.prototype.toString.call(obj),
		"[object Author]",
		"should be Author",
	);
});

test("Author() - Default property values", () => {
	const obj = new Author();
	assert.strictEqual(obj.user, "", ".user should be empty String");
	assert.strictEqual(obj.name, "", ".name should be empty String");
});

test("Author() - Set arguments on the constructor", () => {
	const obj = new Author({ user: "foo", name: "bar" });
	assert.strictEqual(obj.user, "foo", ".user should be the set value");
	assert.strictEqual(obj.name, "bar", ".name should be the set value");
});

test("Author() - Serialize object", () => {
	const obj = new Author({ user: "foo", name: "bar" });

	const o = JSON.parse(JSON.stringify(obj));

	assert.strictEqual(o.user, "foo", ".user should be the set value");
	assert.strictEqual(o.name, "bar", ".name should be the set value");
});
