const FormField = class FormField {
	constructor({ value = "", name = "" } = {}) {
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
		return "FormField";
	}
};
export default FormField;
