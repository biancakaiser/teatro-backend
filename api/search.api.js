/* eslint-disable linebreak-style */
/* eslint-disable indent */
const routes = require("express").Router();

const Joi = require("joi");
const RateLimit = require("express-rate-limit");

const moment = require("moment");


const { wrapAsync, validateRequest } = require("./middleware");
const { getConnection } = require("../core/database.js");
const { JoiEntityId } = require("../core/utils/general.js");

const database = getConnection();

routes.use(new RateLimit({
	windowMs: 5 * 60 * 1000, // 5 minute window
	max: 200, // requests per windowMs
	delayAfter: 100,
	delayMs: 1000,
}));

module.exports = routes;

/**
 * @api {post} /search/presentations Busca espetáculos
 * @apiName presentations
 * @apiGroup Search
 * @apiParam {String} playName Nome da peça
 * @apiParam {String} dateStart Data de início da busca *não implementado
 * @apiParam {String} dateEnd Data de término da busca *não implementado
 * @apiParam {Number} theaterId Id do teatro
 * @apiParam {Number} companyId Id da companhia
 * @apiParam {Number} playGenreId Id do gênero da peça
 * @apiParam {Number} settingGenreId Id do gênero da montagem
 * @apiParam {Number} playId Id da peça
 *
 * @apiSuccess {Object[]} presentations Lista de espetáculos
 */
routes.post("/presentations", validateRequest({
	playName: Joi.string().max(255).allow(""),
	companyName: Joi.string().max(255).allow(""),
	dateStart: Joi.date().allow(null),
	dateEnd: Joi.date().allow(null),
	theaterId: JoiEntityId.allow(null),
	companyId: JoiEntityId.allow(null),
	playGenreId: JoiEntityId.allow(null),
	settingGenreId: JoiEntityId.allow(null),
	playId: JoiEntityId.allow(null),
	languageId: JoiEntityId.allow(null),
	companyNationalityId: JoiEntityId.allow(null),
	playNationalityId: JoiEntityId.allow(null),
	settingKind: Joi.string().max(50).allow(null),
	page: Joi.number().required(),
	playAuthorPersonId: JoiEntityId.allow(null),
	playAdaptorPersonId: JoiEntityId.allow(null),
	playTranslatorPersonId: JoiEntityId.allow(null),
	musicAuthorPersonId: JoiEntityId.allow(null),
	musicArrangerPersonId: JoiEntityId.allow(null),
}), wrapAsync(async (req, res) => {
	const { payload } = res.locals;

	const searchParameters = {
		theaterId: payload.theaterId,
		companyId: payload.companyId,
		"Play.genreId": payload.playGenreId,
		"Play.id": payload.playId,
		"Setting.languageId": payload.languageId,
		"Company.nationalityId": payload.companyNationalityId,
		"Play.nationalityId": payload.playNationalityId,
		"Setting.kind": payload.settingKind,
	};

	// clear undefined search parameters
	Object.keys(searchParameters).forEach((parameter) => {
		if (!searchParameters[parameter]) {
			delete searchParameters[parameter];
		}
	});

	const searchQuery = database("Play")
		.join("Setting", "Setting.playId", "Play.id")
		.join("Presentation", "Presentation.settingId", "Setting.id")
		.join("Theater", "Theater.id", "Presentation.theaterId")
		.join("Company", "Company.id", "Setting.companyId")
		.leftJoin("Nationality as CompanyNationality", "CompanyNationality.id", "Company.nationalityId")
		.leftJoin("Nationality", "Nationality.id", "Play.nationalityId")
		.leftJoin("Genre as PlayGenre", "PlayGenre.id", "Play.genreId")
		.leftJoin("Language", "Language.id", "Setting.languageId")
		.leftJoin("Language as PlayLanguage", "PlayLanguage.id", "Play.languageId");

	const hardcodedConceptions = { // role ids :(
		playAdaptorPersonId: 1,
		musicAuthorPersonId: 4,
		playAuthorPersonId: 5,
		playTranslatorPersonId: 18,
		musicArrangerPersonId: 3,
	};
	const conceptionFilters = Object.keys(payload).filter(key => Object.keys(hardcodedConceptions).includes(key) && payload[key] !== null);

	if (conceptionFilters && conceptionFilters.length) {
		searchQuery.innerJoin("Conception", query1 => conceptionFilters.slice(1).reduce((totalQuery, filter) => totalQuery.orOn(query2 => query2
			.on("Play.id", "=", "Conception.playId")
			.andOn("Conception.personId", "=", payload[filter])
			.andOn("Conception.roleId", "=", hardcodedConceptions[filter])),
			query1
				.on("Play.id", "=", "Conception.playId")
				.andOn("Conception.personId", "=", payload[conceptionFilters[0]])
				.andOn("Conception.roleId", "=", hardcodedConceptions[conceptionFilters[0]])));
	} else {
		searchQuery.leftJoin("Conception", "Play.id", "=", "Conception.playId");
	}

	searchQuery.leftJoin("Person", "Person.id", "=", "Conception.personId")
		.leftJoin("Role", "Role.id", "=", "Conception.roleId")
		.groupBy("Presentation.id")
		.orderBy("Setting.companyId")
		.select({ playId: "Play.id" })
		.where(searchParameters);

	if (payload.playName) {
		searchQuery.andWhere("Play.name", "like", `%${payload.playName}%`);
	}

	if (payload.companyName) {
		searchQuery.andWhere("Company.name", "like", `%${payload.companyName}%`);
	}

	if (payload.dateStart) {
		const dateStart = moment(payload.dateStart).add(3, "hours").format("YYYY-MM-DD");
		searchQuery.andWhere("Presentation.date", ">=", dateStart);
	}

	if (payload.dateEnd) {
		const dateEnd = moment(payload.dateEnd).add(3, "hours").format("YYYY-MM-DD");
		searchQuery.andWhere("Presentation.date", "<=", dateEnd);
	}

	const foundPlayIds = await searchQuery;
	if (!foundPlayIds || !foundPlayIds.length) {
		return res.sendResult({
			total: 0,
			companyCount: 0,
			allPresentations: 0,
			page: payload.page,
			totalPages: 0,
			presentations: [],
			allPlays: 0,
		});
	}

	const total = foundPlayIds.length;

	const offset = 1000 * (payload.page - 1);
	const foundPlays = await database("Play")
		.leftJoin("Nationality", "Nationality.id", "Play.nationalityId")
		.leftJoin("Genre as PlayGenre", "PlayGenre.id", "Play.genreId")
		.leftJoin("Language as PlayLanguage", "PlayLanguage.id", "Play.languageId")
		.leftJoin("Conception", queryBuilder => queryBuilder
			.on("Play.id", "=", "Conception.playId")
			.andOnNotIn("Conception.roleId", [1, 18])) // adaptador e tradutor
		.leftJoin("Person", "Person.id", "=", "Conception.personId")
		.leftJoin("Role", "Role.id", "=", "Conception.roleId")
		.select({
			playId: "Play.id",
			playName: "Play.name",
			playNationality: "Nationality.name",
			playLanguage: "PlayLanguage.name",
			playGenre: "PlayGenre.name",
			playVisible: "Play.visible",
			conceptionsPersonIds: database.raw("GROUP_CONCAT(Person.id SEPARATOR '|')"),
			conceptionsNames: database.raw("GROUP_CONCAT(Person.artistName SEPARATOR '|')"),
			conceptionsVisible: database.raw("GROUP_CONCAT(Person.visible SEPARATOR '|')"),
			conceptionsRoles: database.raw("GROUP_CONCAT(Role.name SEPARATOR '|')"),
		})
		.whereIn("Play.id", foundPlayIds.map(resultRow => resultRow.playId))
		.groupBy("Play.id")
		.limit(1000)
		.offset(offset);

	const settingSearchParameters = { ...searchParameters };
	delete settingSearchParameters["Play.id"];
	delete settingSearchParameters["Play.genreId"];
	delete settingSearchParameters["Play.nationalityId"];

	const settingsQuery = database("Setting")
		.select({
			playId: "Setting.playId",
			companyId: "Company.id",
			companyName: "Company.name",
			companyNationality: "CompanyNationality.name",
			settingId: "Setting.id",
			year: "Setting.year",
			language: "Language.name",
			kind: "Setting.kind",
			settingAdapter: "Setting.adapterId",
			settingTranslator: "Setting.translatorId",
			presentationId: "Presentation.id",
			presentationDate: "Presentation.date",
			sessionsNumber: "Presentation.sessionsNumber",
			theaterName: "Theater.name",
			theaterId: "Theater.id",
		})
		.join("Presentation", "Presentation.settingId", "Setting.id")
		.join("Theater", "Theater.id", "Presentation.theaterId")
		.join("Company", "Company.id", "Setting.companyId")
		.leftJoin("Language", "Language.id", "Setting.languageId")
		.leftJoin("Nationality as CompanyNationality", "CompanyNationality.id", "Company.nationalityId")
		.whereIn("Setting.playId", foundPlayIds.map(resultRow => resultRow.playId))
		.andWhere(settingSearchParameters)
		.orderBy("Setting.companyId")
		.groupBy("Presentation.id");


	if (payload.companyName) {
		settingsQuery.andWhere("Company.name", "like", `%${payload.companyName}%`);
	}

	if (payload.dateStart) {
		const dateStart = moment(payload.dateStart).add(3, "hours").format("YYYY-MM-DD");
		settingsQuery.andWhere("Presentation.date", ">=", dateStart);
	}

	if (payload.dateEnd) {
		const dateEnd = moment(payload.dateEnd).add(3, "hours").format("YYYY-MM-DD");
		settingsQuery.andWhere("Presentation.date", "<=", dateEnd);
	}

	const settings = await settingsQuery;

	// Total de Representações
	const allPresentations = settings.reduce((acc, obj) => acc + obj.sessionsNumber, 0);

	// Total de Peças
	const allPlaysCount = (new Set(settings.map(setting => setting.playId))).size;
	const companyCount = (new Set(settings.map(setting => setting.companyId))).size;

	// Consulta tradutores e adaptadores da montagem
	const translatorsAndAdaptersIds = settings.reduce((allIds, setting) => {
		const adaptersIds = typeof setting.settingAdapter === "string" ? setting.settingAdapter.split(",") : [];
		const translatorsIds = typeof setting.settingTranslator === "string" ? setting.settingTranslator.split(",") : [];
		return allIds.concat(adaptersIds).concat(translatorsIds);
	}, []);

	let translatorsAndAdapters = [];
	if (translatorsAndAdaptersIds.length) {
		translatorsAndAdapters = await database("Person")
			.select("id", "artistName", "visible")
			.whereIn("Person.id", translatorsAndAdaptersIds.map(id => Number(id)));
	}

	// Vincula montagens com peças
	const processedResults = settings.map((settingResult) => {
		// Concepções da peça
		const settingPlay = foundPlays.find(play => play.playId === settingResult.playId);
		if (!settingPlay) {
			return;
		}
		const conceptionsNames = settingPlay.conceptionsNames ? settingPlay.conceptionsNames.split("|") : [];
		const conceptionsRoles = settingPlay.conceptionsRoles ? settingPlay.conceptionsRoles.split("|") : [];
		const conceptionsPersonIds = settingPlay.conceptionsPersonIds ? settingPlay.conceptionsPersonIds.split("|") : [];
		const conceptionsVisible = settingPlay.conceptionsVisible ? settingPlay.conceptionsVisible.split("|") : [];

		const formattedPresentation = Object.assign(settingResult, settingPlay, {
			conceptionsRoles: undefined,
			conceptionsNames: undefined,
			conceptionsPersonIds: undefined,
			conceptionsVisible: undefined,
		});

		// Concepções da montagem
		const adaptersIds = typeof settingResult.settingAdapter === "string" ? settingResult.settingAdapter.split(",") : [];
		const translatorsIds = typeof settingResult.settingTranslator === "string" ? settingResult.settingTranslator.split(",") : [];

		const adapters = translatorsAndAdapters.filter(person => adaptersIds.includes(String(person.id))).map(person => ({
			name: person.artistName,
			role: "Adaptador",
			personId: person.id,
			visible: person.visible,
		}));
		const translators = translatorsAndAdapters.filter(person => translatorsIds.includes(String(person.id))).map(person => ({
			name: person.artistName,
			role: "Tradutor",
			personId: person.id,
			visible: person.visible,
		}));

		formattedPresentation.conceptions = conceptionsNames.reduce((allConceptions, conceptionName, index) => {
			if (conceptionName) {
				allConceptions.push({
					name: conceptionName,
					role: conceptionsRoles[index],
					personId: conceptionsPersonIds[index],
					visible: conceptionsVisible[index],
				});
			}
			return allConceptions;
		}, adapters.concat(translators));

		// eslint-disable-next-line consistent-return
		return formattedPresentation;
	});


	res.sendResult({
		total,
		companyCount,
		allPresentations,
		page: payload.page,
		totalPages: Math.ceil(total / 1000),
		presentations: processedResults,
		allPlays: allPlaysCount,
	});
}));


/**
 * @api {post} /search/people Busca pessoas
 * @apiName people
 * @apiGroup Search
 * @apiParam {String} personName Nome da pessoa
 * @apiParam {String} gender Gênero da pessoa
 * @apiParam {String} race Etnia da pessoa
 * @apiParam {Number} roleId Id do cargo principal
 * @apiParam {String} expertiseId Id do cargo de expertise
 * @apiSuccess {Object[]} people Lista de pessoas encontradas
 */
routes.post("/people", validateRequest({
	personName: Joi.string().max(255).allow(""),
	gender: Joi.string().max(1).allow(""),
	race: Joi.string().max(20).allow(""),
	roleId: JoiEntityId.allow(null),
	expertise: Joi.number().allow(""),
	nationalityId: JoiEntityId.allow(null),
}), wrapAsync(async (req, res) => {
	const { payload } = res.locals;

	const searchParameters = {
		roleId: payload.roleId,
		expertise: payload.expertise,
		nationalityId: payload.nationalityId,
		gender: payload.gender,
		race: payload.race,
	};

	// clear undefined search parameters
	Object.keys(searchParameters).forEach((parameter) => {
		if (!searchParameters[parameter]) {
			delete searchParameters[parameter];
		}
	});
	const searchResults = await database("Person")
		.select("Person.*", database.raw("ANY_VALUE(Role.name) as role"), database.raw("ANY_VALUE(Nationality.name) as nationality"), database.raw("GROUP_CONCAT(JobRole.name SEPARATOR '|') as jobs"), database.raw("GROUP_CONCAT(ConceptionRole.name SEPARATOR '|') as conceptions"), database.raw("GROUP_CONCAT(JobRole.id SEPARATOR '|') as jobsIds"), database.raw("GROUP_CONCAT(Responsible.role SEPARATOR '|') as theaterResponsibilities"))
		.leftJoin("Role", "Role.id", "=", "Person.roleId")
		.leftJoin("Nationality", "Nationality.id", "=", "Person.nationalityId")
		.leftJoin("Job",
			query => query.on("Job.personId", "=", "Person.id")
				.andOnNotIn("Job.roleId", [1, 3, 4, 5, 18])) // Remove as concepções relacionadas à companhia (só é relevante relacionada a uma peça)
		.leftJoin("Responsible", "Responsible.personId", "=", "Person.id")
		.leftJoin("Role as JobRole", "JobRole.id", "=", "Job.roleId")
		// Conception
		.leftJoin("Conception", "Conception.personId", "=", "Person.id")
		.leftJoin("Role as ConceptionRole", "ConceptionRole.id", "=", "Conception.roleId")
		.groupBy("Person.id")
		.where(searchParameters)
		// .andWhere("Person.visible", "=", 1)
		.andWhere(function () { // eslint-disable-line
			this.where("Person.civilName", "like", `%${payload.personName}%`)
				.orWhere("Person.artistName", "like", `%${payload.personName}%`);
		});

	const theaterResponsibilitiesTranslation = {
		OWNER: "Proprietário",
		TENANT: "Arrendatário",
		COMPANY: "Empresa",
		MANAGER: "Gerente",
		BUSINESS: "Empresário",
	};

	searchResults.forEach((result) => {
		const theaterResponsibilities = result.theaterResponsibilities ? result.theaterResponsibilities.split("|") : [];
		const translatedResponsibilities = theaterResponsibilities.map(resp => theaterResponsibilitiesTranslation[resp]);
		const conceptions = result.conceptions ? result.conceptions.split("|") : [];
		const conceptionsAndResponsibilities = translatedResponsibilities.concat(conceptions);
		result.jobs = result.jobs ? result.jobs.split("|").concat(conceptionsAndResponsibilities) : conceptionsAndResponsibilities; // eslint-disable-line
		result.jobsIds = result.jobsIds ? result.jobsIds.split("|") : []; // eslint-disable-line
		result.jobsIds = result.jobsIds.map(jobId => parseInt(jobId, 10));  // eslint-disable-line
	});

	res.sendResult({ people: searchResults });
}));
