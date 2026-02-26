const {
	BaseEntityModel, Model, defineColumn, defineIdColumn, defineForeign,
} = require("../core/base_model");

const { SettingModel } = require("../models/setting.model");
const { TheaterModel } = require("../models/theater.model");

const { Presentation } = require("../entities/presentation.entity");

const PresentationModel = new Model(Presentation, ...BaseEntityModel,
	{
		presentationSetting: defineForeign("settingId", `${SettingModel.tableName}.id`, {}),
		presentationTheater: defineForeign("theaterId", `${TheaterModel.tableName}.id`, {}),
	},
	{ // Colunas
		settingId: defineIdColumn(false),
		theaterId: defineIdColumn(false),
		sessionNumber: defineColumn("integer", 11, undefined, true),
		date: defineColumn("date", {}, undefined, true),
	});

module.exports = {
	PresentationModel,
	modelInfo: PresentationModel,
};
