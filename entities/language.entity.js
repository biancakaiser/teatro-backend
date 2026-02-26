const { BaseEntity } = require("../core/base_entity");

class Language extends BaseEntity {
	constructor(data) {
		super({
			name: null,
			...data,
		})
	}
}

module.exports = {
	Language
};
