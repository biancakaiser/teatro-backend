const { BaseEntity } = require("../core/base_entity");

class Genre extends BaseEntity {
	constructor(data) {
		super({
			name: "",
			...data,
		});
	}
}

module.exports = {
	Genre,
}; 
