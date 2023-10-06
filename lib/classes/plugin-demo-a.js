import Plugin from './plugin.js';

const PluginDemoA = class PluginDemoA extends Plugin {
    constructor({
        name = '',
    } = {}) {
        super();
        this._name = name;
    }

    get name() {
        return this._name;
    }

    onRequestStart(incoming) {
        if (incoming.handle !== 'put:pkg:version') {
            return;
        }

        return new Promise((resolve, reject) => {
            // console.log('PLUGIN A START', this._name, incoming.type, 'pkg:put:start');
            resolve(incoming);
        });
    }

    onRequestEnd(incoming, outgoing) {
        return new Promise((resolve, reject) => {
            // console.log('PLUGIN A END', this._name, incoming.type, 'pkg:put:end');
            resolve(incoming);
        });
    }

    get [Symbol.toStringTag]() {
        return 'PluginDemoA';
    }
}

export default PluginDemoA;