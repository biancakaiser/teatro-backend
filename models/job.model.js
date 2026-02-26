const {
	BaseEntityModel, Model, defineIdColumn, defineForeign, defineColumn,
} = require("../core/base_model");

const { Job } = require("../entities/job.entity");

const { PersonModel } = require("../models/person.model");
const { CompanyModel } = require("./company.model");
const { RoleModel } = require("./role.model");


const JobModel = new Model(Job, ...BaseEntityModel,
	{
		jobPersonId: defineForeign("personId", `${PersonModel.tableName}.id`, {}),
		jobRoleId: defineForeign("roleId", `${RoleModel.tableName}.id`, {}),
		jobCompanyId: defineForeign("companyId", `${CompanyModel.tableName}.id`, {}),
	},
	{ // Colunas
		personId: defineIdColumn(false),
		roleId: defineIdColumn(false),
		companyId: defineIdColumn(false),
		firstDate: defineColumn("varchar", 20, undefined, true),
		lastDate: defineColumn("datetime", {}, undefined, true),

	});

module.exports = {
	JobModel,
	modelInfo: JobModel,
};
