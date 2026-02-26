const { BaseEntityModel, Model, defineColumn, defineForeign, defineIdColumn } = require("../core/base_model");
const { Play } = require("../entities/play.entity");

const { NationalityModel } = require("./nationality.model");
const { PersonModel } = require("./person.model");
const { GenreModel } = require("./genre.model");
const { LanguageModel } = require("./language.model");

const PlayModel = new Model(Play, ...BaseEntityModel,
	{ // Referencias a outras tabelas
		nationalityId: defineIdColumn(false),
		genreId: defineIdColumn(false),
		languageId: defineIdColumn(false),
		authorId: defineIdColumn(false),
		playNationality: defineForeign("nationalityId", `${NationalityModel.tableName}.id`),
		playGenre: defineForeign("genreId", `${GenreModel.tableName}.id`),
		playLanguage: defineForeign("languageId", `${LanguageModel.tableName}.id`),
		playPerson: defineForeign("authorId", `${PersonModel.tableName}.id`),
	},
	{ // Colunas
		visible: defineColumn("boolean", {}, false, false),
		name: defineColumn("varchar"),
		originalName: defineColumn("varchar"),
		referencePlay: defineColumn("varchar"),
		globalFirstDate: defineColumn("varchar"),
		spFirstDate: defineColumn("varchar"),
		bibliography: defineColumn("text", {}, undefined, true),
		citation: defineColumn("text", {}, undefined, true),
		pressReviews: defineColumn("text", {}, undefined, true),
		pressReleases: defineColumn("text", {}, undefined, true),
	}
);

module.exports = {
	PlayModel,
	modelInfo: PlayModel
}
