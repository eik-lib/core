import FS from "@eik/sink-file-system";
import MEM from "@eik/sink-memory";

import VersionsGet from "./handlers/versions.get.js";
import AliasPost from "./handlers/alias.post.js";
import AliasPut from "./handlers/alias.put.js";
import AliasGet from "./handlers/alias.get.js";
import AliasDel from "./handlers/alias.delete.js";
import AuthPost from "./handlers/auth.post.js";
import PkgLog from "./handlers/pkg.log.js";
import PkgGet from "./handlers/pkg.get.js";
import PkgPut from "./handlers/pkg.put.js";
import MapGet from "./handlers/map.get.js";
import MapPut from "./handlers/map.put.js";

import TEST from "./sinks/test.js";

import HealthCheck from "./utils/healthcheck.js";
import globals from "./utils/globals.js";

const http = {
	VersionsGet,
	AliasPost,
	AliasPut,
	AliasGet,
	AliasDel,
	AuthPost,
	PkgLog,
	PkgGet,
	PkgPut,
	MapGet,
	MapPut,
};

/**
 * @deprecated The built-in sinks will be removed in a future version of core.
 * Install the sink you want as a dependency and pass it as an option when constructing the Service.
 * Ex: sink.MEM is replaced by eik/sink-memory. sink.FS is replaced by eik/sink-file-system.
 */
const sink = {
	/**
	 * @deprecated Import eik/sink-memory or implement your own and pass it to the Service instead.
	 */
	TEST,
	/**
	 * @deprecated Import eik/sink-memory and pass it to the Service instead
	 */
	MEM,
	/**
	 * @deprecated Import eik/sink-file-system and pass it to the Service instead
	 */
	FS,
};

const prop = {
  base_auth: globals.BASE_AUTHENTICATION,
  base_map: globals.BASE_IMPORT_MAPS,
  base_pkg: globals.BASE_PACKAGES,
  base_npm: globals.BASE_NPM,
  base_img: globals.BASE_IMG,
};

export default {
	HealthCheck,
	http,
	sink,
	prop,
};
