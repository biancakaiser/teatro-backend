const { BaseEntity } = require("../core/base_entity");

const { Theater } = require("./theater.entity");
const { Setting } = require("./setting.entity");

class Presentation extends BaseEntity {
	constructor(data) {
		super({
			dete: null,
			settingId: null,
			theaterId: null,
			sessionNumber: 0,
			...data,
		});
	}

	get setting() {
		return new Setting({ id: this.settingId });
	}

	get theater() {
		return new Theater({ id: this.theaterId });
	}
}

module.exports = {
	Presentation,
};

