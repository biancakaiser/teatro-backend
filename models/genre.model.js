
const { BaseEntityModel, Model, defineColumn } = require("../core/base_model");
const { Genre } = require("../entities/genre.entity");


const GenreModel = new Model(Genre, ...BaseEntityModel,
	{ // Colunas
		name: defineColumn("varchar"),
	}
);

module.exports = {
	GenreModel,
	modelInfo: GenreModel
}
