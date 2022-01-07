const Author = class Author {
    constructor({ name = '', user = '' } = {}) {
        this._name = name;
        this._user = user;
    }

    get name() {
        return this._name;
    }

    get user() {
        return this._user;
    }

    toJSON() {
        return {
            name: this.name,
            user: this.user,
        };
    }

    get [Symbol.toStringTag]() {
        return 'Author';
    }
}

export default Author;
