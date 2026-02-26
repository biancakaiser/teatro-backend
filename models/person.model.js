const { BaseEntityModel, Model, defineColumn, defineForeign, defineIdColumn } = require("../core/base_model");
const { Person, GenderEnum, RaceEnum } = require("../entities/person.entity");
const { NationalityModel } = require("./nationality.model");
const { RoleModel } = require("./role.model");

const PersonModel = new Model(Person, BaseEntityModel[0],//apenas id
	{ // Referencias a outras tabelas
		roleId: defineIdColumn(false),
		personRole: defineForeign("roleId", `${RoleModel.tableName}.id`),
		nationalityId: defineIdColumn(false),
		personNationality: defineForeign("nationalityId", `${NationalityModel.tableName}.id`),
	},
	{ // Colunas
		visible: defineColumn("boolean", {}, false, false),
		civilName: defineColumn("varchar"),
		artistName: defineColumn("varchar"),
		gender: defineColumn("enu", Object.values(GenderEnum), undefined, true),
		race: defineColumn("enu", Object.values(RaceEnum), undefined, true),
		expertise: defineColumn("varchar", {}, "", false),
		birthDate: defineColumn("date", {}, undefined, true),
		birthPlace: defineColumn("varchar", {}, undefined, true),
		deathDate: defineColumn("date", {}, undefined, true),
		deathPlace: defineColumn("varchar", {}, undefined, true),
		personalPath: defineColumn("text", {}, undefined, true),
		professionalPath: defineColumn("text", {}, undefined, true),
		notes: defineColumn("text", {}, undefined, true),
		bibliography: defineColumn("text", {}, undefined, true),
		citation: defineColumn("text", {}, undefined, true),
	}
);

module.exports = {
	PersonModel,
	modelInfo: PersonModel
}
