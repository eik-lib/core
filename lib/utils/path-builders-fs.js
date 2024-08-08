import path from "node:path";
import globals from "./globals.js";

// Build file system path to a package file

const createFilePathToPackage = ({
	org = "",
	type = "",
	name = "",
	version = "",
} = {}) => path.join(globals.ROOT, org, type, name, `${version}.package.json`);

// Build file system path to an asset in a package
// pkgAsset
const createFilePathToAsset = ({
	org = "",
	type = "",
	name = "",
	version = "",
	asset = "",
} = {}) => path.join(globals.ROOT, org, type, name, version, asset);

// Build file system path to an import map

const createFilePathToImportMap = ({
	org = "",
	name = "",
	version = "",
} = {}) =>
	path.join(
		globals.ROOT,
		org,
		globals.BASE_IMPORT_MAPS,
		name,
		`${version}.import-map.json`,
	);

// Build file system path to an alias file

const createFilePathToAlias = ({
	org = "",
	type = "",
	name = "",
	alias = "",
} = {}) => path.join(globals.ROOT, org, type, name, `${alias}.alias.json`);

// Build file system path to an version file

const createFilePathToVersion = ({ org = "", type = "", name = "" } = {}) =>
	path.join(globals.ROOT, org, type, name, "versions.json");

const createFilePathToEikJson = ({
	org = "",
	type = "",
	name = "",
	version = "",
} = {}) => path.join(globals.ROOT, org, type, name, version, "eik.json");

const createFilePathToAliasOrigin = ({
	org = "",
	type = "",
	name = "",
	version = "",
} = {}) => {
	if (type === "map") {
		return createFilePathToImportMap({ org, name, version });
	}
	return createFilePathToPackage({ org, type, name, version });
};

export {
	createFilePathToPackage,
	createFilePathToAsset,
	createFilePathToImportMap,
	createFilePathToAlias,
	createFilePathToVersion,
	createFilePathToAliasOrigin,
	createFilePathToEikJson,
};
