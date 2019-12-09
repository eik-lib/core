'use strict';

const semver = require('semver');

const Versions = class Versions {
    constructor({ versions = [], name = '', org = '' } = {}) {
        this._versions = new Map(versions);
        this._name = name;
        this._org = org;
    }

    get versions() {
        return Array.from(this._versions.entries()).sort((a, b) => {
            return a[0] > b[0] ? -1 : 1;
        });
    }

    get name() {
        return this._name;
    }

    get org() {
        return this._org;
    }

    setVersion(version, integrity) {
        if (!this.check(version)) {
            throw new Error('Semver version is lower than previous version');
        }
        const major = semver.major(version);
        this._versions.set(major, {
            version,
            integrity,
        });
    }

    getVersion(major) {
        return this._versions.get(major);
    }

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
            name: this.name,
            org: this.org,
        };
    }

    get [Symbol.toStringTag]() {
        return 'Versions';
    }
}
module.exports = Versions;
