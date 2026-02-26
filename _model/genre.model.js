const Model = require("./base_model.js");

module.exports = class extends Model("Genre", {
	id: null,
	name: null,
}) {
	static async getName(id) {
		const genre = await this.findById(id);

		if (genre) return genre.dataObject.name;

		return null;
	}
};
