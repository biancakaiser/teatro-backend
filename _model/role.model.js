const Model = require("./base_model.js");

module.exports = class extends Model("Role", {
	id: null,
	name: null,
}) {
	static async getRole(id) {
		const role = await this.findById(id);

		if (role) return role.dataObject.name;

		return null;
	}
};
