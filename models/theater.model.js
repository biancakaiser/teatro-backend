const { BaseEntityModel, Model, defineColumn } = require("../core/base_model");
const { Theater } = require("../entities/theater.entity");

const TheaterModel = new Model(Theater, ...BaseEntityModel,
	{ // Colunas
		visible: defineColumn("boolean", {}, false, false),
		name: defineColumn("varchar"),
		otherNames: defineColumn("varchar"),
		foundationDate: defineColumn("date", {}, undefined, true),
		foundationAddress: defineColumn("varchar", undefined, true),
		neighborhood: defineColumn("varchar", undefined, true),
		currentAddress: defineColumn("varchar", {}, undefined, true),
		dissolutionDate: defineColumn("date", {}, undefined, true),
		dissolutionReason: defineColumn("varchar", {}, undefined, true),
		seatsNumber: defineColumn("varchar", {}, undefined, true),
		kind: defineColumn("varchar", {}, undefined, true),
		history: defineColumn("text", {}, undefined, true),
		notes: defineColumn("text", {}, undefined, true),
		bibliography: defineColumn("text", {}, undefined, true),
	}
);

module.exports = {
	TheaterModel,
	modelInfo: TheaterModel
}
