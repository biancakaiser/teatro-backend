const Model = require("./base_model.js");

module.exports = class extends Model("Conception", {
	id: null,
	personId: null,
	roleId: null,
	playId: null,
}) {
	setPerson(person) {
		this.personId = person.id;
	}

	setRole(role) {
		this.roleId = role.id;
	}

	setPlay(play) {
		this.playId = play.id;
	}

	static async findByPlay(play) {
		return this.findMultiple({ playId: play.id });
	}
};
