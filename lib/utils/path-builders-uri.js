import path from "node:path";
import globals from "./globals.js";
import { toUrlPathname } from "./url.js";

const createURIPathToPkgLog = ({ type = "", name = "", version = "" } = {}) =>
	toUrlPathname(path.join(globals.ROOT, type, name, version));

const createURIPathToAsset = ({
	type = "",
	name = "",
	version = "",
	asset = "",
} = {}) => toUrlPathname(path.join(globals.ROOT, type, name, version, asset));

const createURIPathToImportMap = ({ name = "", version = "" } = {}) =>
	toUrlPathname(
		path.join(globals.ROOT, globals.BASE_IMPORT_MAPS, name, version),
	);

const createURIToAlias = ({ type = "", name = "", alias = "" } = {}) =>
	toUrlPathname(path.join(globals.ROOT, type, name, `v${alias}`));

const createURIToTargetOfAlias = ({
	type = "",
	name = "",
	version = "",
	extra = "",
} = {}) => toUrlPathname(path.join(globals.ROOT, type, name, version, extra));

export {
	createURIPathToPkgLog,
	createURIPathToAsset,
	createURIPathToImportMap,
	createURIToAlias,
	createURIToTargetOfAlias,
};
