const Model = require("./base_model.js");

module.exports = class extends Model("Language", {
	id: null,
	name: null,
}) {
	static async getName(id) {
		const language = await this.findById(id);

		if (language) return language.dataObject.name;

		return null;
	}
};
