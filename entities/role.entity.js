const { BaseEntity } = require("../core/base_entity");

class Role extends BaseEntity {
	constructor(data) {
		super({
			name: null,
			...data,
		});
	}
}

module.exports = {
	Role,
};
