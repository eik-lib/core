import { PassThrough } from "node:stream";
import FormData from "form-data";
import tap from "tap";
import HttpError from "http-errors";

import Handler from "../../lib/handlers/alias.post.js";
import Sink from "../../lib/sinks/test.js";

const Request = class Request extends PassThrough {
	constructor({ headers = {} } = {}) {
		super();
		this.headers = { host: "localhost", ...headers };
	}
};

tap.test("alias.post() - URL parameters is URL encoded", async (t) => {
	const sink = new Sink();
	sink.set("/local/pkg/@foo/bar-lib/8.1.4-1.package.json", "payload");
	sink.set("/local/pkg/@foo/bar-lib/8.alias.json", "payload");

	const h = new Handler({ sink });

	const formData = new FormData();
	formData.append("version", "8.1.4-1");

	const headers = formData.getHeaders();
	const req = new Request({ headers });
	formData.pipe(req);

	const res = await h.handler(req, "anton", "pkg", "%40foo%2Fbar-lib", "8");

	t.equal(res.statusCode, 303, "should respond with expected status code");
	t.equal(res.location, "/pkg/@foo/bar-lib/v8", ".location should be decoded");
	t.end();
});

tap.test(
	"alias.post() - Prevent non-existing package to map to alias",
	async (t) => {
		const sink = new Sink();
		sink.set("/local/pkg/@foo/bar-lib/8.alias.json", "payload");

		const h = new Handler({ sink });

		const formData = new FormData();
		formData.append("version", "8.1.4-1");

		const headers = formData.getHeaders();
		const req = new Request({ headers });
		formData.pipe(req);

		const res = h.handler(req, "anton", "pkg", "%40foo%2Fbar-lib", "8");

		t.rejects(res, HttpError.NotFound);

		t.end();
	},
);
