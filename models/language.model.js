
const { BaseEntityModel, Model, defineColumn } = require("../core/base_model");
const { Language } = require("../entities/language.entity");


const LanguageModel = new Model(Language, ...BaseEntityModel,
	{ // Colunas
		name: defineColumn("varchar"),
	}
);

module.exports = {
	LanguageModel,
	modelInfo: LanguageModel
}
