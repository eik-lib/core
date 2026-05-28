import { test } from "node:test";
import assert from "node:assert/strict";
import Package from "../../lib/classes/package.js";

test("Package() - object type - should be Package", () => {
	const pkg = new Package();
	assert.strictEqual(Object.prototype.toString.call(pkg), "[object Package]");
});
