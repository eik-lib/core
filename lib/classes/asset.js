import mime from "mime";
import path from "node:path";

/**
 * @typedef {object} AssetOptions
 * @property {string} [pathname]
 * @property {string} [version]
 * @property {string} [name]
 * @property {string} [type]
 * @property {string} [org]
 */

/**
 * Meta information about an Asset.
 */
const Asset = class Asset {
	/**
	 * @param {AssetOptions} options
	 */
	constructor({
		pathname = "",
		version = "",
		name = "",
		type = "",
		org = "",
	} = {}) {
		this._mimeType =
			/** @type {string} */ (mime.getType(pathname)) ||
			"application/octet-stream";
		this._type = type.toLowerCase();
		this._size = -1;

		this._integrity = "";
		this._pathname = path.join("/", pathname);
		this._version = version;
		this._name = name;
		this._org = org;
	}

	get integrity() {
		return this._integrity;
	}

	set integrity(value) {
		this._integrity = value;
	}

	get pathname() {
		return this._pathname;
	}

	get mimeType() {
		return this._mimeType;
	}

	get version() {
		return this._version;
	}

	// Alias for pathname
	get asset() {
		return this._pathname;
	}

	get name() {
		return this._name;
	}

	get type() {
		return this._type;
	}

	set type(value) {
		this._type = value.toLowerCase();
	}

	get size() {
		return this._size;
	}

	set size(value) {
		this._size = value;
	}

	get org() {
		return this._org;
	}

	toJSON() {
		return {
			integrity: this.integrity,
			pathname: this.pathname,
			mimeType: this.mimeType,
			type: this.type,
			size: this.size,
		};
	}

	get [Symbol.toStringTag]() {
		return "Asset";
	}
};

export default Asset;
