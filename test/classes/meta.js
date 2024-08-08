import tap from "tap";
import Meta from "../../lib/classes/meta.js";

tap.test("Meta() - Object type", (t) => {
	const obj = new Meta();
	t.equal(
		Object.prototype.toString.call(obj),
		"[object Meta]",
		"should be Meta",
	);
	t.end();
});

tap.test("Meta() - Default property values", (t) => {
	const obj = new Meta();
	t.equal(obj.value, "", ".value should be empty String");
	t.equal(obj.name, "", ".name should be empty String");
	t.end();
});

tap.test("Meta() - Set arguments on the constructor", (t) => {
	const obj = new Meta({ value: "foo", name: "bar" });
	t.equal(obj.value, "foo", ".value should be the set value");
	t.equal(obj.name, "bar", ".name should be the set value");
	t.end();
});

tap.test("Meta() - Serialize object", (t) => {
	const obj = new Meta({ value: "foo", name: "bar" });

	const o = JSON.parse(JSON.stringify(obj));

	t.equal(o.value, "foo", ".value should be the set value");
	t.equal(o.name, "bar", ".name should be the set value");
	t.end();
});
