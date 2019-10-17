# Asset Pipe REST API

The asset service has the following URI structure

## Packages

Modules are packages of files to be loaded by a browser. Modules are versioned and consist of one or multiple files. A module is immutable.

### Endpoint Summary Table

| Name                                      | Verb | Endpoint                           | Form Fields |
| ----------------------------------------- | ---- | ---------------------------------- | ----------- |
| [Public Package URL](#public-package-url) | GET  | `/:org/pkg/:name/:version/:extras` |             |
| [Upload a Package](#upload-a-package)     | PUT  | `/:org/pkg/:name/:version`         | `filedata`  |

### Public Package URL

**Method:** `GET`

Retrieves files from a module at the service.

```bash
https://:assetServerUrl:port/:org/pkg/:name/:version/:extras
```

URL parameters:

-   `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
-   `:name` is the name of the package. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).
-   `:version` is the version of the package. Validator: Comply with [semver validation regex](https://semver.org/).
-   `:extras` whildcard pathname to any file in the package

Status codes:

-   `200` if file is successfully retrieved
-   `404` if file is not found

Example:

```bash
curl -X GET http://localhost:4001/finn/pkg/fuzz/8.4.1/main/index.js
```

### Upload a package

**Method:** `PUT`

Puts a new package at the service.

```bash
https://:assetServerUrl:port/:org/pkg/:name/:version
```

URL parameters:

-   `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
-   `:name` is the name of the package. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).
-   `:version` is the version of the package. Validator: Comply with [semver validation regex](https://semver.org/).

Form parameters:

-   `:filedata` a `tar` or `tar.gz` containing the package

Status codes:

-   `201` if module is successfully uploaded
-   `400` if validation in URL parameters or form fields fails
-   `401` if user is not authorized
-   `409` if module already exist
-   `415` if file format of the uploaded file is unsupported
-   `502` if package could not be altered by the sink

Example:

```bash
curl -X PUT -i -F filedata=@archive.tgz http://localhost:4001/finn/pkg/fuzz/8.4.1
```


## Import Maps

An [import map](https://github.com/WICG/import-maps) hold a mapping or a set of mappings between ECMA Script Module (ESM) bare imports and an alias of a package.
Import maps are versioned and is immutable.

### Endpoint Summary Table

| Name                                            | Verb | Endpoint                   | Form Fields |
| ----------------------------------------------- | ---- | -------------------------- | ----------- |
| [Public Import Map URL](#public-import-map-url) | GET  | `/:org/map/:name/:version` |             |
| [Upload an Import Map](#upload-an-import-map)   | PUT  | `/:org/map/:name/:version` | `map`       |

### Public Import Maps URL

**Method:** `GET`

Retrieves an import map from the service.

```bash
https://:assetServerUrl:port/:org/map/:name/:version
```

URL parameters:

-   `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
-   `:name` is the name of the import map. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).
-   `:version` is the version of the import map. Validator: Comply with [semver validation regex](https://semver.org/).

Status codes:

-   `200` if import map is successfully retrieved
-   `404` if import map is not found

Example:

```bash
curl -X GET http://localhost:4001/finn/map/buzz/8.4.1
```

### Upload an Import Map

**Method:** `PUT`

Puts a new import map at the service.

```bash
https://:assetServerUrl:port/:org/map/:name/:version
```

URL parameters:

-   `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
-   `:name` is the name of the import map. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).
-   `:version` is the version of the import map. Validator: Comply with [semver validation regex](https://semver.org/).

Form parameters:

-   `:map` a `json` containing the import map

Status codes:

-   `201` if import map is successfully uploaded
-   `400` if validation in URL parameters or form fields fails
-   `401` if user is not authorized
-   `409` if import map already exist
-   `415` if file format of the uploaded import map is unsupported
-   `502` if import map could not be altered by the sink

Example:

```bash
curl -X PUT -i -F map=@import-map.json http://localhost:4001/finn/map/buzz/8.4.1
```


## Aliases

An alias is a shorthand between a major version of a package / import map and the set exact version of the package / import map.


### Endpoint Summary Table

| Name                                  | Verb   | Endpoint                            | Form Fields |
| ------------------------------------- | ------ | ----------------------------------- | ----------- |
| [Public Alias URL](#public-alias-url) | GET    | `/:org/:type/:name/v:alias/:extras` |             |
| [Create Alias](#create-alias)         | PUT    | `/:org/:type/:name/v:alias`         | `version`   |
| [Update Alias](#update-alias)         | POST   | `/:org/:type/:name/v:alias`         | `version`   |
| [Delete Alias](#delete-alias)         | DELETE | `/:org/:type/:name/v:alias`         |             |

### Public Alias URL

**Method:** `GET`

Retrieves files from a package or a import map at the service.

```bash
https://:assetServerUrl:port/:org/:type/:name/v:alias/:extras
```

URL parameters:

-   `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
-   `:type` is the type to retrieve from. Validator: `pkg` or `map`.
-   `:name` is the name of the package / import map. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).
-   `:alias` is the major version of the package / import map. Validator: Comply with [semver validation regex](https://semver.org/).
-   `:extras` whildcard pathname to any file in a package. Does not apply to import maps.

Status codes:

-   `303` if alias exist
-   `404` if alias is not found

Example:

```bash
 curl -X GET -L http://localhost:4001/finn/pkg/fuzz/v8/main/index.js
 curl -X GET -L http://localhost:4001/finn/map/buzz/v4
```

### Create Alias

**Method:** `PUT`

Create a new alias.

```bash
https://:assetServerUrl:port/:org/:type/:name/v:alias
```

URL parameters:

-   `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
-   `:type` is the type to retrieve from. Validator: `pkg` or `map`.
-   `:name` is the name of the package / import map. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).
-   `:alias` is the major version of the package / import map. Validator: Comply with [semver validation regex](https://semver.org/).

Form parameters:

-   `:version` full version of the package to be aliased

Status codes:

-   `201` if alias is successfully created
-   `400` if validation in URL parameters or form fields fails
-   `401` if user is not authorized
-   `409` if alias already exist
-   `502` if alias could not be altered by the sink

Example:

```bash
curl -X PUT -i -F version=8.4.1 http://localhost:4001/finn/pkg/fuzz/v8
curl -X PUT -i -F version=4.2.2 http://localhost:4001/finn/map/buzz/v4
```

### Update Alias

**Method:** `POST`

Updates an existing alias.

```bash
https://:assetServerUrl:port/:org/:type/:name/v:alias
```

URL parameters:

-   `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
-   `:type` is the type to retrieve from. Validator: `pkg` or `map`.
-   `:name` is the name of the package / import map. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).
-   `:alias` is the major version of the package / import map. Validator: Comply with [semver validation regex](https://semver.org/).

Form parameters:

-   `:version` full version of the package to be aliased

Status codes:

-   `204` if alias is successfully updated
-   `400` if validation in URL parameters or form fields fails
-   `401` if user is not authorized
-   `404` if alias does not exist
-   `502` if alias could not be altered by the sink

Example:

```bash
curl -X POST -i -F version=8.4.1 http://localhost:4001/finn/pkg/fuzz/v8
curl -X POST -i -F version=4.4.2 http://localhost:4001/finn/map/buzz/v4
```

### Delete Alias

**Method:** `DELETE`

Deletes an existing alias.

```bash
https://:assetServerUrl:port/:org/:type/:name/v:alias
```

URL parameters:

-   `:org` is the name of your organisation. Validator: [`^[a-zA-Z0-9_-]+$`](https://regexper.com/#%5E%5Ba-zA-Z0-9_-%5D%2B%24).
-   `:type` is the type to retrieve from. Validator: `pkg` or `map`.
-   `:name` is the name of the package / import map. Validator: Comply with [npm package names](https://github.com/npm/validate-npm-package-name).
-   `:alias` is the major version of the package / import map. Validator: Comply with [semver validation regex](https://semver.org/).

Status codes:

-   `204` if alias is successfully deleted
-   `400` if validation in URL parameters or form fields fails
-   `401` if user is not authorized
-   `404` if alias does not exist
-   `502` if alias could not be altered by the sink

Example:

```bash
curl -X DELETE http://localhost:4001/finn/pkg/fuzz/v8
curl -X DELETE http://localhost:4001/finn/map/buzz/v4
```
