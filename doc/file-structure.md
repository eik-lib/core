# Asset Pipe File Structure

The asset service store files in the following structure:

```sh
:root
└── :org
    ├── map
    │   └── :name
    │       ├── :version.json
    │       └── :major.alias.json
    └── pkg
        └── :name
            ├── :version
            │   ├── *
            ├── :version.log.json
            └── :major.alias.json
```

Parameters:

-   `:root` is a root folder for everything.
-   `:org` is the name of organisations.
-   `:name` is the name of packages.
-   `:version` is the full semver version of a package.
-   `:major` is the major semver version of a full semver version of a package.

## Packages

Packages are stored under `/:root/:org/pkg/:name/:version/` and the structure of a package is
arbitrary and untouched duing upload by the service.

The file structure of a package is stored in a log file at `/:root/:org/pkg/:name/:version.log.json`.

## Import Maps

Import maps are stored under `/:root/:org/map/:name/:version.json`. The filename of import maps
is strict and conform to the version number its given and a `.json` extension.

The filename of import maps prior to uploading to the service can be anything. The service will
convert the file name according to the parameters given when uploading it.

## Aliases

Both packages and import map versions can be aliased. An alias is a semver major version of a
full semver version and are a way to map a major version to a given full semver version of a
package or import map.

This alias mapping is stored alongside the version of a package or import map version:

-   Package alias path: `/:root/:org/pkg/:name/:major.alias.json`
-   Import map alias path: `/:root/:org/map/:name/:major.alias.json`
