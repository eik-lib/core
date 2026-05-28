import { Writable, pipeline } from "node:stream";
import { stream } from "@eik/common";
import { URL } from "node:url";
import { randomBytes } from "node:crypto";
const slug = () => randomBytes(4).toString("hex");
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import Sink from "../../lib/sinks/test.js";

const RE_TIMESTAMP = /"timestamp": [0-9.]+,/gi;
const RE_DIRECTORY_TRAVERSAL = /Directory traversal/;

const DEFAULT_CONFIG = {};
const FIXTURE = fs
	.readFileSync(new URL("../../fixtures/import-map.json", import.meta.url))
	.toString();

const MetricsInto = class MetricsInto extends Writable {
	constructor() {
		super({ objectMode: true });
		/** @type {any[]} */
		this._metrics = [];
	}

	_write(
		/** @type {any} */ chunk,
		/** @type {any} */ encoding,
		/** @type {any} */ callback,
	) {
		this._metrics.push(chunk);
		callback();
	}

	done() {
		return new Promise((resolve) => {
			this.once("finish", () => {
				resolve(JSON.stringify(this._metrics, null, 2));
			});
			this.end();
		});
	}
};

const readFileStream = (file = "../README.md") =>
	fs.createReadStream(new URL(file, import.meta.url));

const pipeInto = (/** @type {any[]} */ ...streams) =>
	new Promise((resolve, reject) => {
		/** @type {any[]} */
		const buffer = [];

		const to = new Writable({
			objectMode: false,
			write(chunk, encoding, callback) {
				buffer.push(chunk);
				callback();
			},
		});

		// @ts-expect-error
		pipeline(...streams, to, (error) => {
			if (error) return reject(error);
			const str = buffer.join("").toString();
			return resolve(str);
		});
	});

const pipe = (/** @type {any[]} */ ...streams) =>
	/** @type {Promise<void>} */ (
		new Promise((resolve, reject) => {
			// @ts-expect-error
			pipeline(...streams, (error) => {
				if (error) return reject(error);
				return resolve();
			});
		})
	);

test("Sink() - Object type", () => {
	const sink = new Sink(DEFAULT_CONFIG);
	const name = Object.prototype.toString.call(sink);
	assert.ok(name.startsWith("[object Sink"), "should begin with Sink");
});

test("Sink() - .write()", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	const dir = slug();
	const file = `${dir}/bar/map.json`;

	const writeFrom = readFileStream("../../fixtures/import-map.json");
	const writeTo = await sink.write(file, "application/json");

	await assert.doesNotReject(
		pipe(writeFrom, writeTo),
		"should write file to sink",
	);

	// Clean up sink
	await sink.delete(dir);
});

test("Sink() - .write() - arguments is illegal", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	const dir = slug();

	await assert.rejects(
		sink.write(/** @type {any} */ (300), "application/octet-stream"),
		new TypeError("Argument must be a String"),
		"should reject on illegal filepath",
	);
	await assert.rejects(
		sink.write(`${dir}/bar/map.json`, /** @type {any} */ (300)),
		new TypeError("Argument must be a String"),
		"should reject on illegal mime type",
	);
});

test("Sink() - .write() - directory traversal prevention", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	const dir = slug();

	await assert.rejects(
		sink.write(`../../${dir}/sensitive.data`, "application/octet-stream"),
		RE_DIRECTORY_TRAVERSAL,
		"should reject on ../../ at beginning of filepath",
	);
	await assert.rejects(
		sink.write(`../${dir}/sensitive.data`, "application/octet-stream"),
		RE_DIRECTORY_TRAVERSAL,
		"should reject on ../ at beginning of filepath",
	);
	await assert.rejects(
		sink.write(
			`/${dir}/../../../foo/sensitive.data`,
			"application/octet-stream",
		),
		RE_DIRECTORY_TRAVERSAL,
		"should reject on path traversal in the middle of filepath",
	);
	await assert.doesNotReject(
		sink.write(`./${dir}/sensitive.data`, "application/octet-stream"),
		"should resolve on ./ at beginning of filepath",
	);
	await assert.doesNotReject(
		sink.write(`/${dir}/sensitive.data`, "application/octet-stream"),
		"should resolve on / at beginning of filepath",
	);
	await assert.doesNotReject(
		sink.write(`//${dir}/sensitive.data`, "application/octet-stream"),
		"should resolve on // at beginning of filepath",
	);

	// Clean up sink
	await sink.delete(dir);
});

test("Sink() - .read() - File exists", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	const dir = slug();
	const file = `${dir}/bar/map.json`;

	const writeFrom = readFileStream("../../fixtures/import-map.json");
	const writeTo = await sink.write(file, "application/json");

	await pipe(writeFrom, writeTo);

	const readFrom = await sink.read(file);

	assert.ok(
		stream.isReadableStream(readFrom.stream),
		"should resolve with a ReadFile object which has a .stream property",
	);
	assert.strictEqual(
		typeof readFrom.mimeType,
		"string",
		"should resolve with a ReadFile object which has a .mimeType property",
	);
	assert.strictEqual(
		typeof readFrom.etag,
		"string",
		"should resolve with a ReadFile object which has a .etag property",
	);

	const result = await pipeInto(readFrom.stream);

	assert.strictEqual(
		result,
		FIXTURE,
		"should read file from sink which equals the fixture",
	);

	// Clean up sink
	await sink.delete(dir);
});

test("Sink() - .read() - File does NOT exist", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	const dir = slug();
	await assert.rejects(
		sink.read(`/${dir}/foo/not-exist.json`),
		"should reject",
	);
});

test("Sink() - .read() - arguments is illegal", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	await assert.rejects(
		sink.read(/** @type {any} */ (300)),
		new TypeError("Argument must be a String"),
		"should reject on illegal filepath",
	);
});

test("Sink() - .read() - directory traversal prevention", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	const dir = slug();
	const file = `${dir}/map.json`;

	const writeFrom = readFileStream("../../fixtures/import-map.json");
	const writeTo = await sink.write(file, "application/json");

	await pipe(writeFrom, writeTo);

	await assert.rejects(
		sink.read(`../../${dir}/sensitive.data`),
		RE_DIRECTORY_TRAVERSAL,
		"should reject on ../../ at beginning of filepath",
	);
	await assert.rejects(
		sink.read(`../${dir}/sensitive.data`),
		RE_DIRECTORY_TRAVERSAL,
		"should reject on ../ at beginning of filepath",
	);
	await assert.rejects(
		sink.read(`/${dir}/../../../foo/sensitive.data`),
		RE_DIRECTORY_TRAVERSAL,
		"should reject on path traversal in the middle of filepath",
	);
	await assert.doesNotReject(
		sink.read(`./${file}`),
		"should resolve on ./ at beginning of filepath",
	);
	await assert.doesNotReject(
		sink.read(`/${file}`),
		"should resolve on / at beginning of filepath",
	);
	await assert.doesNotReject(
		sink.read(`//${file}`),
		"should resolve on // at beginning of filepath",
	);

	// Clean up sink
	await sink.delete(dir);
});

test("Sink() - .read() - value of .mimeType of known file type", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	const dir = slug();
	const file = `${dir}/bar/map.json`;

	const writeFrom = readFileStream("../../fixtures/import-map.json");
	const writeTo = await sink.write(file, "application/json");

	await pipe(writeFrom, writeTo);

	const readFrom = await sink.read(file);

	assert.strictEqual(
		readFrom.mimeType,
		"application/json",
		"should resolve with a ReadFile object which has a value for .mimeType matching the file",
	);

	// Clean up sink
	await sink.delete(dir);
});

test("Sink() - .delete() - Delete existing file", async () => {
	const sink = new Sink(DEFAULT_CONFIG);

	const dir = slug();
	const file = `${dir}/bar/map.json`;

	const writeFrom = readFileStream("../../fixtures/import-map.json");
	const writeTo = await sink.write(file, "application/json");

	await pipe(writeFrom, writeTo);

	await assert.doesNotReject(
		sink.exist(file),
		"should resolve - file is in sink before deletion",
	);

	await sink.delete(file);

	await assert.rejects(sink.exist(file), "should reject - file was deleted");

	// Clean up sink
	await sink.delete(dir);
});

test("Sink() - .delete() - Delete non existing file", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	await assert.doesNotReject(
		sink.delete("/bar/foo/not-exist.json"),
		"should resolve",
	);
});

test("Sink() - .delete() - Delete file in tree structure", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	const dir = slug();
	const fileA = `${dir}/a/map.json`;
	const fileB = `${dir}/b/map.json`;

	const writeFromA = readFileStream("../../fixtures/import-map.json");
	const writeToA = await sink.write(fileA, "application/json");
	await pipe(writeFromA, writeToA);

	const writeFromB = readFileStream("../../fixtures/import-map.json");
	const writeToB = await sink.write(fileB, "application/json");
	await pipe(writeFromB, writeToB);

	await sink.delete(fileA);

	await assert.rejects(
		sink.exist(fileA),
		"should reject on file A - file was deleted",
	);
	await assert.doesNotReject(
		sink.exist(fileB),
		"should resolve on file B - file was NOT deleted",
	);

	// Clean up sink
	await sink.delete(dir);
});

test("Sink() - .delete() - Delete files recursively", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	const dir = slug();
	const fileA = `${dir}/a/map.json`;
	const fileB = `${dir}/b/map.json`;

	const writeFromA = readFileStream("../../fixtures/import-map.json");
	const writeToA = await sink.write(fileA, "application/json");
	await pipe(writeFromA, writeToA);

	const writeFromB = readFileStream("../../fixtures/import-map.json");
	const writeToB = await sink.write(fileB, "application/json");
	await pipe(writeFromB, writeToB);

	await sink.delete(dir);

	await assert.rejects(
		sink.exist(fileA),
		"should reject on file A - file was deleted",
	);
	await assert.rejects(
		sink.exist(fileB),
		"should reject on file B - file was deleted",
	);
});

test("Sink() - .delete() - arguments is illegal", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	await assert.rejects(
		sink.delete(/** @type {any} */ (300)),
		new TypeError("Argument must be a String"),
		"should reject on illegal filepath",
	);
});

test("Sink() - .delete() - directory traversal prevention", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	const dir = slug();
	const file = `${dir}/map.json`;

	await assert.rejects(
		sink.delete(`../../${dir}/sensitive.data`),
		RE_DIRECTORY_TRAVERSAL,
		"should reject on ../../ at beginning of filepath",
	);
	await assert.rejects(
		sink.delete(`../${dir}/sensitive.data`),
		RE_DIRECTORY_TRAVERSAL,
		"should reject on ../ at beginning of filepath",
	);
	await assert.rejects(
		sink.delete(`/${dir}/../../../foo/sensitive.data`),
		RE_DIRECTORY_TRAVERSAL,
		"should reject on path traversal in the middle of filepath",
	);
	await assert.doesNotReject(
		sink.delete(`./${file}`),
		"should resolve on ./ at beginning of filepath",
	);
	await assert.doesNotReject(
		sink.delete(`/${file}`),
		"should resolve on / at beginning of filepath",
	);
	await assert.doesNotReject(
		sink.delete(`//${file}`),
		"should resolve on // at beginning of filepath",
	);

	// Clean up sink
	await sink.delete(dir);
});

test("Sink() - .exist() - Check existing file", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	const dir = slug();
	const file = `${dir}/map.json`;

	const writeFrom = readFileStream("../../fixtures/import-map.json");
	const writeTo = await sink.write(file, "application/json");

	await pipe(writeFrom, writeTo);

	await assert.doesNotReject(
		sink.exist(file),
		"should resolve - file is in sink",
	);

	// Clean up sink
	await sink.delete(dir);
});

test("Sink() - .exist() - Check non existing file", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	await assert.rejects(
		sink.exist("/bar/foo/not-exist.json"),
		"should reject - file does not exist",
	);
});

test("Sink() - .exist() - arguments is illegal", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	await assert.rejects(
		sink.exist(/** @type {any} */ (300)),
		new TypeError("Argument must be a String"),
		"should reject on illegal filepath",
	);
});

test("Sink() - .exist() - directory traversal prevention", async () => {
	const sink = new Sink(DEFAULT_CONFIG);
	const dir = slug();
	const file = `${dir}/map.json`;

	const writeFrom = readFileStream("../../fixtures/import-map.json");
	const writeTo = await sink.write(file, "application/json");

	await pipe(writeFrom, writeTo);

	await assert.rejects(
		sink.exist(`../../${dir}/sensitive.data`),
		RE_DIRECTORY_TRAVERSAL,
		"should reject on ../../ at beginning of filepath",
	);
	await assert.rejects(
		sink.exist(`../${dir}/sensitive.data`),
		RE_DIRECTORY_TRAVERSAL,
		"should reject on ../ at beginning of filepath",
	);
	await assert.rejects(
		sink.exist(`/${dir}/../../../foo/sensitive.data`),
		RE_DIRECTORY_TRAVERSAL,
		"should reject on path traversal in the middle of filepath",
	);
	await assert.doesNotReject(
		sink.exist(`./${file}`),
		"should resolve on ./ at beginning of filepath",
	);
	await assert.doesNotReject(
		sink.exist(`/${file}`),
		"should resolve on / at beginning of filepath",
	);
	await assert.doesNotReject(
		sink.exist(`//${file}`),
		"should resolve on // at beginning of filepath",
	);

	// Clean up sink
	await sink.delete(dir);
});

test("Sink() - .metrics - all successfull operations", async (t) => {
	const sink = new Sink(DEFAULT_CONFIG);
	const dir = slug();
	const file = `${dir}/bar/map.json`;

	const metricsInto = new MetricsInto();
	sink.metrics.pipe(metricsInto);

	// write, check, read and delete file
	const writeFrom = readFileStream("../../fixtures/import-map.json");
	const writeTo = await sink.write(file, "application/json");
	await pipe(writeFrom, writeTo);

	await sink.exist(file);

	const readFrom = await sink.read(file);
	await pipeInto(readFrom.stream);

	await sink.delete(dir);

	const metrics = await metricsInto.done();
	const cleaned = metrics.replace(RE_TIMESTAMP, '"timestamp": -1,');
	t.assert.snapshot(cleaned);
});
