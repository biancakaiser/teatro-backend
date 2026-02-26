const {
	BaseEntityModel, Model, defineColumn, defineForeign, defineIdColumn,
} = require("../core/base_model");
const { Company } = require("../entities/company.entity");
const { NationalityModel } = require("./nationality.model");

const CompanyModel = new Model(Company, ...BaseEntityModel,
	{ // Referencias a outras tabelas
		nationalityId: defineIdColumn(false),
		companyNationality: defineForeign("nationalityId", `${NationalityModel.tableName}.id`),
	},
	{ // Colunas
		visible: defineColumn("boolean", {}, "0", false),
		name: defineColumn("varchar"),
		otherNames: defineColumn("varchar"),
		foundationDate: defineColumn("date", {}, undefined, true),
		foundationPlace: defineColumn("varchar", {}, undefined, true),
		dissolutionDate: defineColumn("date", {}, undefined, true),
		path: defineColumn("text", {}, undefined, true),
		notes: defineColumn("text", {}, undefined, true),
		bibliography: defineColumn("text", {}, undefined, true),
		citation: defineColumn("text", {}, undefined, true),
	});

module.exports = {
	CompanyModel,
	modelInfo: CompanyModel,
};
