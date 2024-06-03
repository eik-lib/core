import Plugin from './plugin.js';

const PluginDemoB = class PluginDemoB extends Plugin {
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
            return false;
        }

        return new Promise((resolve, reject) => {
            // console.log('PLUGIN B START', this._name, incoming.type, 'pkg:put:start');
            resolve(incoming);
        });
    }

    get [Symbol.toStringTag]() {
        return 'PluginDemoB';
    }
}

export default PluginDemoB;