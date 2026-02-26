const { BaseEntity } = require("../core/base_entity.js");

class Theater extends BaseEntity {
	constructor(data) {
		super({
			name: "",
			foundationAddress: "",
			foundationDate: null,
			neighborhood: "",
			currentAddress: "",
			dissolutionDate: null,
			dissolutionReason: "",
			seatsNumber: 0,
			kind: "",
			history: "",
			notes: "",
			bibliography: "",
			otherNames: "",
			...data,
		});
	}
}

module.exports = {
	Theater,
};
