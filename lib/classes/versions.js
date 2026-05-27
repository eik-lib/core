import semver from "semver";

const Versions = class Versions {
	/**
	 * @param {{ versions?: [any, any][], type?: string, name?: string, org?: string }} [options]
	 */
	constructor({ versions = [], type = "", name = "", org = "" } = {}) {
		this._versions = new Map(versions);
		this._type = type;
		this._name = name;
		this._org = org;
	}

	get versions() {
		return [...this._versions.entries()].toSorted(
			(/** @type {[any, any]} */ a, /** @type {[any, any]} */ b) =>
				a[0] > b[0] ? -1 : 1,
		);
	}

	get type() {
		return this._type;
	}

	get name() {
		return this._name;
	}

	get org() {
		return this._org;
	}

	/**
	 * @param {string} version
	 * @param {string} integrity
	 */
	setVersion(version, integrity) {
		const major = semver.major(version);
		this._versions.set(major, {
			version,
			integrity,
		});
	}

	/**
	 * @param {number} major
	 */
	getVersion(major) {
		return this._versions.get(major);
	}

	/**
	 * @param {string} version
	 */
	check(version) {
		const major = semver.major(version);
		const previous = this.getVersion(major);
		if (previous) {
			if (semver.gte(previous.version, version)) {
				return false;
			}
		}
		return true;
	}

	toJSON() {
		return {
			versions: this.versions,
			type: this.type,
			name: this.name,
			org: this.org,
		};
	}

	get [Symbol.toStringTag]() {
		return "Versions";
	}
};
export default Versions;
