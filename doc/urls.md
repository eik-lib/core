# Asset Pipe REST API

The asset service has the following URI structure

## Modules

Modules are packages of files to be loaded by a browser. Modules are versioned and consist of one or multiple files. A module is imutable.

### Method: `GET`

Retrieves files from a module at the service.

```bash
https://:assetServerUrl:port/:org/assets/:type/:name/:version/:extras
```

URL parameters:

* `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
* `:type` is the type of the package, can be `js` or `css`. Validator: [\bcss\b|\bjs\b](https://regexper.com/#%5Cbcss%5Cb%7C%5Cbjs%5Cb).
* `:name` is the name of the package. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).
* `:version` is the version of the package. Validator: Comply with [semver validation regex](https://semver.org/).
* `:extras` whildcard pathname to any file in the package

Status codes:

* `200` if file is successfully retrieved
* `404` if file is not found

Example:

```bash
curl http://localhost:4001/finn/assets/js/lit-html/8.4.1/index.js
curl http://localhost:4001/finn/assets/js/lit-html/8.4.1/lib/util/parser.js
```

### Method: `PUT`

Puts a new package at the service.

```bash
https://:assetServerUrl:port/:org/assets/:type/:name/:version
```

URL parameters:

* `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
* `:type` is the type of the package, can be `js` or `css`. Validator: [\bcss\b|\bjs\b](https://regexper.com/#%5Cbcss%5Cb%7C%5Cbjs%5Cb).
* `:name` is the name of the package. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).
* `:version` is the version of the package. Validator: Comply with [semver validation regex](https://semver.org/).

Form parameters:

* `:filedata` a `tar` or `tar.gz` containing the package

Status codes:

* `201` if module is successfully uploaded
* `400` if validation in URL parameters or form fields fails
* `401` if user is not authorized
* `409` if module already exist
* `415` if file format of the uploaded file is unsupported
* `502` if package could not be altered by the sink

Example:

```bash
curl -X PUT -i -F filedata=@file.tar http://localhost:4001/finn/assets/js/lit-html/8.4.1
```

## Aliases

An alias is a shorthand between a major version of a package and the set exact version of the package.

### Method: `GET`

Retrieves files from a module at the service.

```bash
https://:assetServerUrl:port/:org/alias/:type/:name/:alias/:extras
```

URL parameters:

* `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
* `:type` is the type of the package, can be `js` or `css`. Validator: [\bcss\b|\bjs\b](https://regexper.com/#%5Cbcss%5Cb%7C%5Cbjs%5Cb).
* `:name` is the name of the package. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).
* `:alias` is the major version of the package. Validator: Comply with [semver validation regex](https://semver.org/).
* `:extras` whildcard pathname to any file in the package

Status codes:

* `303` if alias exist
* `404` if alias is not found

Example:

```bash
curl http://localhost:4001/finn/alias/js/lit-html/8/index.js
curl http://localhost:4001/finn/alias/js/lit-html/8/lib/util/parser.js
```

### Method: `PUT`

Puts a new alias at the service.

```bash
https://:assetServerUrl:port/:org/alias/:type/:name/:alias
```

URL parameters:

* `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
* `:type` is the type of the package, can be `js` or `css`. Validator: [\bcss\b|\bjs\b](https://regexper.com/#%5Cbcss%5Cb%7C%5Cbjs%5Cb).
* `:name` is the name of the package. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).
* `:alias` is the major version of the package. Validator: Comply with [semver validation regex](https://semver.org/).

Form parameters:

* `:version` full version of the package to be aliased

Status codes:

* `201` if alias is successfully created
* `400` if validation in URL parameters or form fields fails
* `401` if user is not authorized
* `409` if alias already exist
* `502` if alias could not be altered by the sink

Example:

```bash
curl -X PUT -i -F version=8.4.1 http://localhost:4001/finn/assets/js/lit-html/8
```

### Method: `POST`

Updates an existing alias at the service.

```bash
https://:assetServerUrl:port/:org/alias/:type/:name/:alias
```

URL parameters:

* `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
* `:type` is the type of the package, can be `js` or `css`. Validator: [\bcss\b|\bjs\b](https://regexper.com/#%5Cbcss%5Cb%7C%5Cbjs%5Cb).
* `:name` is the name of the package. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).
* `:alias` is the major version of the package. Validator: Comply with [semver validation regex](https://semver.org/).

Form parameters:

* `:version` full version of the package to be aliased

Status codes:

* `204` if alias is successfully updated
* `400` if validation in URL parameters or form fields fails
* `401` if user is not authorized
* `404` if alias does not exist
* `502` if alias could not be altered by the sink

Example:

```bash
curl -X PUT -i -F version=8.4.1 http://localhost:4001/finn/assets/js/lit-html/8
```

### Method: `DELETE`

Deletes an existing alias from the service.

```bash
https://:assetServerUrl:port/:org/alias/:type/:name/:alias
```

URL parameters:

* `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
* `:type` is the type of the package, can be `js` or `css`. Validator: [\bcss\b|\bjs\b](https://regexper.com/#%5Cbcss%5Cb%7C%5Cbjs%5Cb).
* `:name` is the name of the package. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).
* `:alias` is the major version of the package. Validator: Comply with [semver validation regex](https://semver.org/).

Status codes:

* `204` if alias is successfully deleted
* `400` if validation in URL parameters or form fields fails
* `401` if user is not authorized
* `404` if alias does not exist
* `502` if alias could not be altered by the sink

Example:

```bash
curl -X DELETE http://localhost:4001/finn/assets/js/lit-html/8
```

## Import Maps

An import map hold a mapping or a set of mappings between ECMA Script Module (ESM) bare imports a alias of a package. import maps specification is defined here: https://github.com/WICG/import-maps

### Method: `GET`

Retrieves a import map from the service.

```bash
https://:assetServerUrl:port/:org/import-maps/:name
```

URL parameters:

* `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
* `:name` is the name of the import map. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).

Status codes:

* `200` if import map exist
* `404` if import map is not found

Example:

```bash
curl http://localhost:4001/finn/alias/my-mapping
```

### Method: `PUT`

Puts a new import map at the service.

```bash
https://:assetServerUrl:port/:org/import-maps/:name
```

URL parameters:

* `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
* `:name` is the name of the import map. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).

Form parameters:

* `:specifier` the specifier of an import in the import map
* `:address` the address of an import in the import map

Status codes:

* `201` if import map is successfully created
* `400` if validation in URL parameters or form fields fails
* `401` if user is not authorized
* `409` if import map already exist
* `502` if import map could not be altered by the sink

Example:

```bash
curl -X PUT -i -F specifier=lit-html -F address=http://localhost:4001/finn/assets/js/lit-html/8 http://localhost:4001/finn/import-maps/my-mapping
```

### Method: `DELETE`

Deletes an existing import map from the service.

```bash
https://:assetServerUrl:port/:org/import-maps/:name
```

URL parameters:

* `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
* `:name` is the name of the import map. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).

Status codes:

* `204` if import map is successfully deleted
* `400` if validation in URL parameters or form fields fails
* `401` if user is not authorized
* `404` if import map does not exist
* `502` if import map could not be altered by the sink

Example:

```bash
curl -X DELETE http://localhost:4001/finn/import-maps/my-mapping
```

### Method: `PATCH`

Upates the content of an existing import map at the service.

```bash
https://:assetServerUrl:port/:org/import-maps/:name
```

URL parameters:

* `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
* `:name` is the name of the import map. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).

Form parameters:

* `:specifier` the specifier of an import in the import map
* `:address` the address of an import in the import map (if empty, import is removed)

Status codes:

* `201` if import map is successfully updated
* `400` if validation in URL parameters or form fields fails
* `401` if user is not authorized
* `404` if import map does not exist
* `502` if import map could not be altered by the sink

Example:

```bash
curl -X PATCH -i -F specifier=lit-element -F address=http://localhost:4001/finn/assets/js/lit-element/3 http://localhost:4001/finn/import-maps/my-mapping
