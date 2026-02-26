const {
	BaseEntityModel, Model, defineColumn,
} = require("../core/base_model");

const { Page } = require("../entities/page.entity");

const PageModel = new Model(Page, ...BaseEntityModel,
	{ // Colunas
		title: defineColumn("varchar"),
		description: defineColumn("varchar"),
		content: defineColumn("text"),
	});

module.exports = {
	PageModel,
	modelInfo: PageModel
}
