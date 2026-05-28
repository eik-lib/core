import { test } from "node:test";
import assert from "node:assert/strict";
import HealthCheck from "../../lib/utils/healthcheck.js";
import Sink from "../../lib/sinks/test.js";

test("HealthCheck() - Object type", () => {
	const health = new HealthCheck();
	const name = Object.prototype.toString.call(health);
	assert.ok(
		name.startsWith("[object HealthCheck"),
		"should begin with HealthCheck",
	);
});

test("HealthCheck() - Sink is healthy", async () => {
	const sink = new Sink();

	const health = new HealthCheck({ sink });
	const result = await health.check();

	assert.strictEqual(result, true, 'Should resolve with "true" as a value');
});
