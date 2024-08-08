import tap from "tap";
import HealthCheck from "../../lib/utils/healthcheck.js";
import Sink from "../../lib/sinks/test.js";

tap.test("HealthCheck() - Object type", (t) => {
	const health = new HealthCheck();
	const name = Object.prototype.toString.call(health);
	t.ok(name.startsWith("[object HealthCheck"), "should begin with HealthCheck");
	t.end();
});

tap.test("HealthCheck() - Sink is healthy", (t) => {
	const sink = new Sink();

	const health = new HealthCheck({ sink });
	const check = health.check();

	t.resolveMatch(check, true, 'Should resolve with "true" as a value');
	t.end();
});
