# @eik/core

This module holds the core server functionality of [`@eik/service`](https://github.com/eik-lib/service#readme).
Each [HTTP API endpoint](https://eik.dev/docs/server/http-api) has
its own class handling the specific path and method.

## API

### http

This namespace holds the different HTTP API endpoint handlers. Each handler is a class with an async `handler` method.

```js
import { http } from "@eik/core";

let pkgGetHandler = new eik.http.PkgGet({ organizations, sink, logger });

let response = await pkgGetHandler.handler(
	request,
	type,
	name,
	version,
	extras,
);
```

For a more complete usage example, see
[the implementation in `@eik/service`](https://github.com/eik-lib/service/blob/00c85c1d366df50b688a82e62e5890381df11b0f/lib/main.js#L76-L113).

### prop

A gollection of globals holding base paths.

```js
import { prop } from "@eik/core";

const { base_auth, base_map, base_pkg, base_npm } = prop;
```

### HealthCheck

A health check implementation that does a create, read and delete check
against the configured [storage sink](https://eik.dev/docs/server/storage).

```js
import { HealthCheck } from "@eik/core";

const health = new HealthCheck({
	logger,
	sink,
});

await health.check();
```
