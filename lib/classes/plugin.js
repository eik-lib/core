import abslog from 'abslog';

const Plugin = class Plugin {
    constructor({
        logger,
    } = {}) {
        this._log = abslog(logger);
    }

    onRequestStart() {
        return undefined;
    }

    onRequestEnd() {
        return undefined;
    }

    healthcheck() {
        return undefined;
    }

    get [Symbol.toStringTag]() {
        return 'Plugin';
    }
}
export default Plugin;