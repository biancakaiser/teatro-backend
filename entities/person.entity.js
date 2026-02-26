const { BaseEntity } = require("../core/base_entity");

const GenderEnum = Object.freeze({
	MALE: "M",
	FEMALE: "F",
	OTHER: "O"
});

const RaceEnum = Object.freeze({
	BRANCA: "BRANCA",
	PRETA: "PRETA",
	AMARELA: "AMARELA",
	PARDA: "PARDA",
	INDIGENA: "INDIGENA"
})

class Person extends BaseEntity {
	constructor(data) {
		super({
			id: null,
			visible: 0,
			civilName: "",
			artistName: "",
			gender: null,
			race: null,
			roleId: null,
			expertise: "",
			birthDate: null,
			birthPlace: "",
			deathDate: "",
			deathPlace: "",
			personalPath: "",
			professionalPath: "",
			notes: "",
			bibliography: "",
			citation: "",
			nationalityId: null,
			...data,
		});
	}
}

module.exports = {
	Person,
	GenderEnum,
	RaceEnum,
};
