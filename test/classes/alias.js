import tap from "tap";
import Alias from "../../lib/classes/alias.js";

tap.test("Alias() - Object type", (t) => {
	const obj = new Alias();
	t.equal(
		Object.prototype.toString.call(obj),
		"[object Alias]",
		"should be Alias",
	);
	t.end();
});

tap.test("Alias() - Default property values", (t) => {
	const obj = new Alias();
	t.equal(obj.version, "", ".version should be empty String");
	t.equal(obj.alias, "", ".alias should be empty String");
	t.equal(obj.name, "", ".name should be empty String");
	t.equal(obj.type, "", ".type should be empty String");
	t.equal(obj.org, "", ".org should be empty String");
	t.end();
});

tap.test("Alias() - Set values to the arguments on the constructor", (t) => {
	const obj = new Alias({
		version: "1.0.0",
		alias: "v1",
		name: "buzz",
		type: "pkg",
		org: "bizz",
	});
	t.equal(obj.version, "", ".version should be empty String");
	t.equal(obj.alias, "v1", ".alias should contain value set on constructor");
	t.equal(obj.name, "buzz", ".name should contain value set on constructor");
	t.equal(obj.type, "pkg", ".type should contain value set on constructor");
	t.equal(obj.org, "bizz", ".org should contain value set on constructor");
	t.end();
});

tap.test("Alias() - Set a value on the .version property", (t) => {
	const obj = new Alias({
		version: "1.0.0",
	});
	obj.version = "2.0.0";
	t.equal(obj.version, "2.0.0", ".version should be value set on .version");
	t.end();
});

tap.test("Alias() - Serialize object", (t) => {
	const obj = new Alias({
		version: "1.0.0",
		alias: "v1",
		name: "buzz",
		type: "pkg",
		org: "bizz",
	});
	obj.version = "2.0.0";

	const o = JSON.parse(JSON.stringify(obj));

	t.equal(o.version, "2.0.0", ".version should be value set on .version");
	t.equal(o.alias, "v1", ".alias should contain value set on constructor");
	t.equal(o.name, "buzz", ".name should contain value set on constructor");
	t.equal(o.type, "pkg", ".type should contain value set on constructor");
	t.equal(o.org, "bizz", ".org should contain value set on constructor");
	t.end();
});
