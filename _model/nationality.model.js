const Model = require("./base_model.js");

module.exports = class extends Model("Nationality", {
	id: null,
	name: null,
}) {
	static async getName(id) {
		const nationality = await this.findById(id);

		if (nationality) return nationality.dataObject.name;

		return null;
	}
};
