const { BaseEntity } = require("../core/base_entity");

class Nationality extends BaseEntity {
	constructor(data) {
		super({
			name: null,
			...data,
		});
	}
}

module.exports = {
	Nationality,
};
