import { Readable } from "node:stream";
import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeUriComponent, streamCollector } from "../../lib/utils/utils.js";

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

test("streamCollector() - correctly reassembles multi-byte UTF-8 characters split across chunk boundaries", async () => {
	// The '€' sign is encoded as three bytes: 0xE2 0x82 0xAC.
	// Split the first byte into one chunk and the remaining two into another
	// to simulate a TCP chunk boundary cutting through a multi-byte sequence.
	// The old buffer.join("").toString() decoded each chunk separately,
	// producing U+FFFD replacement characters. Buffer.concat() is correct.
	const firstChunk = Buffer.from([0x7b, 0x22, 0x6b, 0x22, 0x3a, 0x22, 0xe2]); // {"k":"<first byte of €>
	const secondChunk = Buffer.from([0x82, 0xac, 0x22, 0x7d]); //                 <remaining bytes of €>"}

	const stream = new Readable({ read() {} });
	stream.push(firstChunk);
	stream.push(secondChunk);
	stream.push(null);

	const result = await streamCollector(stream);

	assert.strictEqual(
		result,
		'{"k":"€"}',
		"should correctly decode multi-byte UTF-8 characters split across chunks",
	);
});
