const { BaseEntity } = require("../core/base_entity");

const { Person } = require("../entities/person.entity");
const { Role } = require("../entities/role.entity");
const { Play } = require("../entities/play.entity");

class Conception extends BaseEntity {
	constructor(data) {
		super({
			personId: null,
			roleId: null,
			playId: null,
			...data,
		});
	}

	get person() {
		return new Person({ id: this.personId });
	}

	get role() {
		return new Role({ id: this.roleId });
	}

	get play() {
		return new Play({ id: this.roleId });
	}
}

module.exports = {
	Conception,
};
