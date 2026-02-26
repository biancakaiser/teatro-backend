const Model = require("./base_model.js");

module.exports = class extends Model("Presentation", {
	id: null,
	date: null,
	settingId: null,
	theaterId: null,
	sessionsNumber: 0,
}) {
	setSetting(setting) {
		this.settingId = setting.id;
	}

	setTheater(theater) {
		this.theaterId = theater.id;
	}

	static async findBySetting(setting) {
		return this.findMultiple({ settingId: setting.id });
	}

	static async findByTheater(theater) {
		return this.findMultiple({ theaterId: theater.id });
	}
};
