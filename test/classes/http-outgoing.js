import { Readable } from "node:stream";
import tap from "tap";
import HttpOutgoing from "../../lib/classes/http-outgoing.js";

tap.test("HttpOutgoing() - Object type", (t) => {
	const obj = new HttpOutgoing();
	t.equal(
		Object.prototype.toString.call(obj),
		"[object HttpOutgoing]",
		"should be HttpIncoming",
	);
	t.end();
});

tap.test("HttpOutgoing() - Default property values", (t) => {
	const obj = new HttpOutgoing();
	t.equal(obj.statusCode, 200, ".statusCode should be the Number 200");
	t.equal(obj.location, "", ".location should be empty String");
	t.equal(
		obj.mimeType,
		"text/plain",
		'.mimeType should be the String "text/plain"',
	);
	t.type(obj.stream, "undefined", ".stream should be undefined");
	t.type(obj.body, "undefined", ".body should be undefined");
	t.equal(obj.etag, "", ".etag should be empty String");
	t.end();
});

tap.test("HttpOutgoing() - Set .statusCode to legal value", (t) => {
	const obj = new HttpOutgoing();
	obj.statusCode = 404;
	t.equal(obj.statusCode, 404, ".statusCode should be the set value");
	t.end();
});

tap.test("HttpOutgoing() - Set .statusCode to non numeric value", (t) => {
	t.plan(1);
	t.throws(
		() => {
			const obj = new HttpOutgoing();
			// @ts-expect-error Testing bad input
			obj.statusCode = "fouronefour";
		},
		/Value is not a legal http status code/,
		"Should throw",
	);
	t.end();
});

tap.test(
	"HttpOutgoing() - Set .statusCode to a illegal http status code",
	(t) => {
		t.plan(1);
		t.throws(
			() => {
				const obj = new HttpOutgoing();
				obj.statusCode = 98555555;
			},
			/Value is not a legal http status code/,
			"Should throw",
		);
		t.end();
	},
);

tap.test("HttpOutgoing() - Set .location to legal value", (t) => {
	const obj = new HttpOutgoing();
	obj.location = "/foo";
	t.equal(obj.location, "/foo", ".location should be the set value");
	t.end();
});

tap.test("HttpOutgoing() - Set .mimeType to legal value", (t) => {
	const obj = new HttpOutgoing();
	obj.mimeType = "text/javascript";
	t.equal(obj.mimeType, "text/javascript", ".location should be the set value");
	t.end();
});

tap.test("HttpOutgoing() - Set .stream to legal value", (t) => {
	const obj = new HttpOutgoing();
	obj.stream = new Readable();
	t.ok(obj.stream instanceof Readable, ".stream should be the set value");
	t.end();
});

tap.test(
	"HttpOutgoing() - Set a non Readable stream as value on the .stream property",
	(t) => {
		t.plan(1);
		t.throws(
			() => {
				const obj = new HttpOutgoing();
				obj.stream = "foo";
			},
			/Value is not a Readable stream/,
			"Should throw",
		);
		t.end();
	},
);

tap.test("HttpOutgoing() - Set .body to legal value", (t) => {
	const obj = new HttpOutgoing();
	obj.body = "foo";
	t.equal(obj.body, "foo", ".location should be the set value");
	t.end();
});

tap.test("HttpOutgoing() - Set .etag to legal value", (t) => {
	const obj = new HttpOutgoing();
	obj.etag = "foo";
	t.equal(obj.etag, "foo", ".location should be the set value");
	t.end();
});
