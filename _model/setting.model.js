const Model = require("./base_model.js");
const Company = require("./company.model.js");
const Person = require("./person.model.js");
const Role = require("./role.model.js");
const Genre = require("./genre.model.js");
const Presentation = require("./presentation.model.js");
const Language = require("./language.model.js");
const Theater = require("./theater.model.js");

module.exports = class extends Model("Setting", {
	id: null,
	playId: null,
	companyId: null,
	genreId: null,
	year: "",
	languageId: null,
	kind: "",
	translatorId: null,
	adapterId: null,
}) {
	async setPlay(play) {
		this.playId = play.id;
	}

	async setCompany(company) {
		this.companyId = company.id;
	}

	async setGenre(genre) {
		this.genreId = genre.id;
	}

	async setTranslator(translatorID) {
		this.translatorId = translatorID;
	}

	async setAdapter(adapterID) {
		this.adapterId = adapterID;
	}

	async addPresentation(date, theater, sessionsNumber) {
		const presentation = new Presentation();
		presentation.setSetting(this);
		presentation.setTheater(theater);
		presentation.date = date;
		presentation.sessionsNumber = sessionsNumber;

		await presentation.save();

		return presentation;
	}

	async removePresentation(presentation) {
		if (presentation.settingId !== this.id) {
			throw Error("WRONG_SETTING");
		}
		await presentation.remove();
	}

	async listPresentations() {
		return Presentation.findBySetting(this);
	}

	async getInfo() {
		const basicInfo = await super.getInfo();

		const presentations = await this.listPresentations();

		basicInfo.presentations = await Promise.all(presentations.map(async (presentation) => {
			const info = await presentation.getInfo();

			if (info.theaterId) {
				const theater = await Theater.findById(info.theaterId);
				info.theater = await theater.getInfo();
			}

			return info;
		}));


		if (basicInfo.companyId) {
			const foundCompany = await Company.findById(basicInfo.companyId);
			basicInfo.company = await foundCompany.getInfo();
		}

		if (basicInfo.genreId) basicInfo.genre = await Genre.getName(basicInfo.genreId);
		if (basicInfo.languageId) basicInfo.language = await Language.getName(basicInfo.languageId);

		return basicInfo;
	}

	static async findByPlay(play) {
		return this.findMultiple({ playId: play.id });
	}

	static async findByCompany(company) {
		return this.findMultiple({ companyId: company.id });
	}
};
