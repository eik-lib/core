import { PassThrough, pipeline, Writable } from "node:stream";
import tap from "tap";

import Handler from "../../lib/handlers/alias.get-v2.js";
import Alias from "../../lib/classes/alias.js";
import Sink from "../../lib/sinks/test.js";

const pipeInto = (...streams) =>
	new Promise((resolve, reject) => {
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

const Request = class Request extends PassThrough {
	constructor({ headers = {} } = {}) {
		super();
		this.headers = { host: "localhost", ...headers };
	}
};

tap.test("v2 alias.get() - URL parameters is URL encoded", async (t) => {
	const sink = new Sink();

	// create a file with payload content
	sink.set("/local/pkg/@foo/bar-lib/5.2.3/foo/main.js", "payload");

	// set an alias to the previously created file
	const alias = new Alias({
		alias: "5",
		name: "@foo/bar-lib",
		type: "pkg",
		org: "local",
	});
	alias.version = "5.2.3";
	sink.set("/local/pkg/@foo/bar-lib/5.alias.json", JSON.stringify(alias));

	// call the alias get handler
	const h = new Handler({ sink });
	const req = new Request();
	const res = await h.handler(
		req,
		"pkg",
		"%40foo%2Fbar-lib",
		"5",
		"%2Ffoo%2Fmain.js",
	);

	const result = await pipeInto(res.stream);

	t.equal(res.statusCode, 200, "should respond with expected status code");
	t.equal(
		result,
		"payload",
		"should return file payload when alias is requested",
	);
	t.end();
});
