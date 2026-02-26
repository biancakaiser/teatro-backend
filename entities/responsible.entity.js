const { BaseEntity } = require("../core/base_entity");

const ResponsibleRoleEnum = Object.freeze({
	OWNER: "OWNER",
	TENANT: "TENANT",
	BUSINESS: "BUSINESS",
	MANAGER: "MANAGER",
	COMPANY: "COMPANY",
});

class Responsible extends BaseEntity {
	constructor(data) {
		super({
			name: "",
			role: null,
			theaterId: null,
			personId: null,
			lastDate: null,
			firsDate: null,
			...data,
		});
	}
}

module.exports = {
	ResponsibleRoleEnum,
	Responsible,
};
