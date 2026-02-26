
const { BaseEntityModel, Model, defineColumn } = require("../core/base_model");
const { Role } = require("../entities/role.entity");


const RoleModel = new Model(Role, ...BaseEntityModel,
	{ // Colunas
		name: defineColumn("varchar"),
	}
);

module.exports = {
	RoleModel,
	modelInfo: RoleModel
}
