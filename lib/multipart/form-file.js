const FormFile = class FormFile {
	constructor({ value = [], name = "" } = {}) {
		if (!Array.isArray(value))
			throw new TypeError('The argument "value" must be of type Array');
		this._value = value;
		this._name = name;
	}

	get value() {
		return this._value;
	}

	get name() {
		return this._name;
	}

	toJSON() {
		return {
			value: this.value,
			name: this.name,
		};
	}

	get [Symbol.toStringTag]() {
		return "FormFile";
	}
};
export default FormFile;
