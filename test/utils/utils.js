import { Readable } from "node:stream";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
	decodeUriComponent,
	streamCollector,
	readJSON,
	writeJSON,
} from "../../lib/utils/utils.js";
import Sink from "../../lib/sinks/test.js";

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

// Regression: readJSON and writeJSON must use readBuffer/writeBuffer (no pipeline)
test("readJSON() - reads JSON via readBuffer without stream pipeline", async () => {
	const sink = new Sink();
	const filePath = "/test/data.json";
	const data = { hello: "world" };
	await sink.writeBuffer(
		filePath,
		"application/json",
		Buffer.from(JSON.stringify(data)),
	);
	const result = await readJSON(sink, filePath);
	assert.deepStrictEqual(result, data, "should return parsed JSON");
});

test("writeJSON() - writes JSON via writeBuffer without stream pipeline", async () => {
	const sink = new Sink();
	const filePath = "/test/write.json";
	const data = { foo: "bar" };
	await writeJSON(sink, filePath, data, "application/json");
	const buf = await sink.readBuffer(filePath);
	assert.deepStrictEqual(
		JSON.parse(buf.toString()),
		data,
		"should have written correct JSON",
	);
});
