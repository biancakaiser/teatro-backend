const {
	BaseEntityModel, Model, defineColumn, defineIdColumn, defineForeign,
} = require("../core/base_model");

const { CompanyModel } = require("../models/company.model");
const { PersonModel } = require("../models/person.model");

const { ResourceRelation } = require("../entities/resource_relation.entity");

const ResourceRelationModel = new Model(ResourceRelation, ...BaseEntityModel,
	{
		resourceCompanyId: defineForeign("companyId", `${CompanyModel.tableName}.id`, {}),
		resourcePersonId: defineForeign("personId", `${PersonModel.tableName}.id`, {}),
	},
	{ // Colunas
		UUID: defineColumn("varchar", 36),
		companyId: defineIdColumn(true),
		personId: defineIdColumn(true),
		theaterId: defineIdColumn(true),
		playId: defineIdColumn(true),
	});

module.exports = {
	ResourceRelationModel,
	modelInfo: ResourceRelationModel,
};
