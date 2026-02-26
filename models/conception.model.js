const {
	BaseEntityModel, Model, defineIdColumn, defineForeign,
} = require("../core/base_model");

const { Conception } = require("../entities/conception.entity");

const { PersonModel } = require("../models/person.model");
const { PlayModel } = require("./play.model");
const { RoleModel } = require("./role.model");


const ConceptionModel = new Model(Conception, ...BaseEntityModel,
	{
		conceptionPersonId: defineForeign("personId", `${PersonModel.tableName}.id`, {}),
		conceptionRoleId: defineForeign("roleId", `${RoleModel.tableName}.id`, {}),
		conceptionPlayId: defineForeign("playId", `${PlayModel.tableName}.id`, {}),
	},
	{ // Colunas
		personId: defineIdColumn(false),
		roleId: defineIdColumn(false),
		playId: defineIdColumn(false),
	});

module.exports = {
	ConceptionModel,
	modelInfo: ConceptionModel,
};
