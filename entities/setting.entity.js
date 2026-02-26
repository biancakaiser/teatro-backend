const { BaseEntity } = require("../core/base_entity");

const { Company } = require("./company.entity");
const { Genre } = require("./genre.entity");
const { Play } = require("./play.entity");
const { Language } = require("./language.entity");

const SettingKindEnum = Object.freeze({
	COMPLETE: "COMPLETE",
	SESSIONS: "SESSIONS",
	STATE_SCREEN: "STATE_SCREEN",
});

class Setting extends BaseEntity {
	constructor(data) {
		super({
			dete: null,
			playId: null,
			companyId: null,
			genreId: null,
			year: null,
			languageId: null,
			kind: null,
			// translatorId: null,
			// adapterId: null,
			...data,
		});
	}

	get player() {
		return new Play({ id: this.playerId });
	}

	get genre() {
		return new Genre({ id: this.genreId });
	}

	get company() {
		return new Company({ id: this.companyId });
	}

	get language() {
		return new Language({ id: this.languageId });
	}
}

module.exports = {
	Setting,
	SettingKindEnum,
};
