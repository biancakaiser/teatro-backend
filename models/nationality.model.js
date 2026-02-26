
const { BaseEntityModel, Model, defineColumn } = require("../core/base_model");
const { Nationality } = require("../entities/nationality.entity");


const NationalityModel = new Model(Nationality, ...BaseEntityModel,
	{ // Colunas
		name: defineColumn("varchar"),
	}
);

module.exports = {
	NationalityModel,
	modelInfo: NationalityModel
}
