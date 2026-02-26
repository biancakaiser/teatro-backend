const {
	BaseEntityModel, Model, defineColumn, defineIdColumn, defineForeign,
} = require("../core/base_model");

const { Responsible, ResponsibleRoleEnum } = require("../entities/responsible.entity");

const { TheaterModel } = require("../models/theater.model");
const { PersonModel } = require("./person.model");


const ResponsibleModel = new Model(Responsible, ...BaseEntityModel,
	{
		responsibleTheater: defineForeign("theaterId", `${TheaterModel.tableName}.id`, {}),
		responsiblePerson: defineForeign("personId", `${PersonModel.tableName}.id`, {}),
	},
	{ // Colunas
		theaterId: defineIdColumn(false),
		personId: defineIdColumn(true),
		firstDate: defineColumn("varchar", 20, undefined, true),
		lastDate: defineColumn("varchar", 20, undefined, true),

		role: defineColumn("enu", Object.values(ResponsibleRoleEnum), undefined, true),
		name: defineColumn("varchar", {}, undefined, true),
	});

module.exports = {
	ResponsibleModel,
	modelInfo: ResponsibleModel,
};
