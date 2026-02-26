const { BaseEntity } = require("../core/base_entity");

const { Person } = require("../entities/person.entity");
const { Role } = require("../entities/role.entity");
const { Company } = require("../entities/company.entity");

class Job extends BaseEntity {
	constructor(data) {
		super({
			personId: null,
			roleId: null,
			companyId: null,
			lastDate: null,
			...data,
		});
	}

	get person() {
		return new Person({ id: this.personId });
	}

	get role() {
		return new Role({ id: this.roleId });
	}

	get company() {
		return new Company({ id: this.companyId });
	}
}

module.exports = {
	Job,
};
