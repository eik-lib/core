import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeUriComponent } from "../../lib/utils/utils.js";

test(".decodeUriComponent()", () => {
	assert.strictEqual(
		decodeUriComponent("%40foo%2Fbar"),
		"@foo/bar",
		"should decode URI encodings",
	);
	assert.strictEqual(
		decodeUriComponent("8%2E1%2E4%2D1"),
		"8.1.4-1",
		"should decode URI encodings",
	);
	assert.strictEqual(
		decodeUriComponent(undefined),
		undefined,
		"should keep a undefined value as undefined",
	);
	assert.strictEqual(
		decodeUriComponent(undefined),
		undefined,
		"should keep a null value as null",
	);
});
