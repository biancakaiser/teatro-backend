const { BaseEntity } = require("../core/base_entity");

class Company extends BaseEntity {
	constructor(data) {
		super({
			visible: 0,
			name: "",
			otherNames: "",
			foundationDate: null,
			foundationPlace: "",
			disosolutionDate: null,
			path: "",
			notes: "",
			bibliography: "",
			citation: "",
			nationalityId: null,
			nationality: null,
			...data,
		});
	}
}

module.exports = {
	Company,
};
