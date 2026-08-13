const FormFile = class FormFile {
	/**
	 * @param {{ value?: any[], name?: string, eikJson?: Record<string,any>|null }} [options]
	 */
	constructor({ value = [], name = "", eikJson = null } = {}) {
		if (!Array.isArray(value))
			throw new TypeError('The argument "value" must be of type Array');
		this._value = value;
		this._name = name;
		this._eikJson = eikJson;
	}

	get value() {
		return this._value;
	}

	get name() {
		return this._name;
	}

	/** @returns {Record<string,any>|null} */
	get eikJson() {
		return this._eikJson;
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
