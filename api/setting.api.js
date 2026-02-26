const routes = require("express").Router();

const Joi = require("joi");
const RateLimit = require("express-rate-limit");
const Setting = require("../_model/setting.model.js");
const Presentation = require("../_model/presentation.model.js");
const Theater = require("../_model/theater.model.js");
const Play = require("../_model/play.model.js");
const Company = require("../_model/company.model.js");
const Person = require("../_model/person.model.js");
const Genre = require("../_model/genre.model.js");

const { wrapAsync, authenticate, validateRequest } = require("./middleware");
const { JoiEntityId } = require("../core/utils/general");
const { SettingBaseRepo } = require("../repositories/repositories");

routes.use(new RateLimit({
	windowMs: 5 * 60 * 1000, // 5 minute window
	max: 200, // requests per windowMs
	delayAfter: 100,
	delayMs: 1000,
}));

module.exports = routes;


/**
 * @api {post} /setting/create Cria uma montagem de uma peça
 *
 * @apiName Create
 * @apiGroup Setting
 *
 * @apiParam {Number} playId Id da peça
 * @apiParam {Number} companyId Id da companhia que realizou a montagem
 * @apiParam {Number} genreId Id do gênero da montagem
 * @apiParam {Number} languageId Id do idioma da montagem
 * @apiParam {Number} year Ano de realização da montagem
 * @apiParam {String} kind Tipo de espetaculo
 * @apiParam {Number} translatorId Id do tradutor
 * @apiParam {Number} adapterId Id do adaptador
 *
 * @apiSuccess {Object} play Objeto com os dados da montagem
 */
routes.post("/create", authenticate(), validateRequest({
	playId: JoiEntityId,
	companyId: JoiEntityId,
	genreId: JoiEntityId.allow(null),
	year: Joi.string().length(4).allow(""),
	languageId: JoiEntityId.allow(null),
	kind: Joi.string().allow("", null),
	translatorId: JoiEntityId.allow(null),
	adapterId: JoiEntityId.allow(null),
}), wrapAsync(async (req, res) => {
	const { payload } = res.locals;
	const setting = new Setting();

	const play = await Play.getById(payload.playId);
	const company = await Company.getById(payload.companyId);

	setting.setPlay(play);
	setting.setCompany(company);

	if (payload.genreId) {
		const genre = await Genre.getById(payload.genreId);
		setting.setGenre(genre);
	}

	if (payload.languageId) {
		setting.languageId = payload.languageId;
	}

	if (payload.year) {
		setting.year = payload.year;
	}

	if (payload.kind) {
		setting.kind = payload.kind.toUpperCase();
		setting.kind.replace(" ", "_");
	}

	if (payload.translatorId) {
		// const translator = await Person.getById(payload.translatorId);
		setting.setTranslator(payload.translatorId);
	}

	if (payload.adapterId) {
		// const adapter = await Person.getById(payload.adapterId);
		setting.setAdapter(payload.adapterId);
	}

	await setting.save();

	res.sendResult({ setting: await setting.getInfo() });
}));

/**
 * @api {post} /setting/update Atualiza uma montagem de uma peça
 *
 * @apiName update
 * @apiGroup Setting
 *
 * @apiParam {Number} playId Id da peça
 * @apiParam {Number} companyId Id da companhia que realizou a montagem
 * @apiParam {Number} genreId Id do gênero da montagem
 * @apiParam {Number} languageId Id do idioma da montagem
 * @apiParam {Number} year Ano de realização da montagem
 * @apiParam {String} kind Tipo de espetaculo
 * @apiParam {Number} translatorId Id do tradutor
 * @apiParam {Number} adapterId Id do adaptador
 *
 * @apiSuccess {Object} play Objeto com os dados da montagem
 */
routes.post("/update", authenticate(), validateRequest({
	id: Joi.string().required(),
	playId: JoiEntityId.allow("", null),
	companyId: JoiEntityId.allow("", null),
	// genreId: JoiEntityId.allow(null),
	year: Joi.string().length(4).allow("", null),
	languageId: JoiEntityId.allow("", null),
	kind: Joi.string().allow("", null),
	translatorId: JoiEntityId.allow("", null),
	adapterId: JoiEntityId.allow("", null),
}), wrapAsync(async (req, res) => {
	const { payload } = res.locals;
	const setting = await Setting.getById(payload.id);

	if (payload.playId) {
		const play = await Play.getById(payload.playId);
		setting.setPlay(play);
	}

	if (payload.companyId) {
		const company = await Company.getById(payload.companyId);
		setting.setCompany(company);
	}

	if (payload.languageId) {
		setting.languageId = payload.languageId;
	}

	if (payload.year) {
		setting.year = payload.year;
	}

	if (payload.kind) {
		setting.kind = payload.kind.toUpperCase();
		setting.kind.replace(" ", "_");
	}

	if (payload.translatorId) {
		setting.translatorId = payload.translatorId === " " ? null : payload.translatorId;
	}

	if (payload.adapterId) {
		setting.adapterId = payload.adapterId === " " ? null : payload.adapterId;
	}

	await setting.save();

	res.sendResult({ setting: await setting.getInfo() });
}));

/**
 * @api {post} /setting/addPresentation Adiciona um espetáculo à montagem
 * @apiName addPresentation
 * @apiGroup Setting
 * @apiParam {Number} settingId Id da montagem
 * @apiParam {Number} theaterId Id do teatro em que o espetáculo foi apresentado
 * @apiParam {String} date Data do espetáculo
 * @apiParam {Number} sessionsNumber Número de sessões
 * @apiSuccess {Object} setting Objeto com os dados da montagem
 */
routes.post("/addPresentation", authenticate(), validateRequest({
	settingId: JoiEntityId.required(),
	theaterId: JoiEntityId.required(),
	date: Joi.date().required(),
	sessionsNumber: Joi.number().required(),
}), wrapAsync(async (req, res) => {
	const { payload } = res.locals;

	const setting = await Setting.getById(payload.settingId);
	const theater = await Theater.getById(payload.theaterId);

	const presentation = await setting.addPresentation(payload.date, theater, payload.sessionsNumber);

	res.sendResult({ presentation: await presentation.getInfo() });
}));

/**
 * @api {post} /setting/removePresentation Remove um espetáculo da montagem
 *
 * @apiName removePresentation
 * @apiGroup Setting
 *
 * @apiParam {Number} presentationId Id da apresentação
 *
 *
 * @apiSuccess {Object} setting Objeto com os dados da montagem
 */
routes.post("/removePresentation", authenticate(), validateRequest({
	presentationId: JoiEntityId.required(),

}), wrapAsync(async (req, res) => {
	const { payload } = res.locals;
	const presentation = await Presentation.getById(payload.presentationId);
	await presentation.remove();

	res.sendResult();
}));


/**
 * @api {post} /setting/getRecord Retorna todas as informações de uma montagem
 * @apiName getRecord
 * @apiGroup Setting
 * @apiParam {Number} settingId <code>ID</code> do teatro
 * @apiError {String} ERR_API_SETTING_NOT_FOUND Teatro não encontrado
 */
routes.post("/getRecord", validateRequest({
	settingId: JoiEntityId.required(),
}), wrapAsync(async (req, res) => {
	const { payload } = res.locals;

	const foundSetting = await Setting.findById(payload.settingId);
	if (!foundSetting) throw Error("ERR_API_SETTING_NOT_FOUND");

	res.sendResult({ setting: await foundSetting.getInfo() });
}));

/**
 * @api {post} /setting/getAll Retorna as informações de todas as montagens
 * @apiName getAll
 * @apiGroup Setting
 * @apiParam {Number} settingId <code>ID</code> da montagem
 */
routes.post("/getAll", validateRequest({
}), wrapAsync(async (req, res) => {
	const settings = await SettingBaseRepo.find();
	res.sendResult({ settings: settings.map(setting => setting.sanitized()) });
}));

/**
 * @api {post} /setting/removePresentation Remove um membro de elenco da montagem
 * @apiName removePresentation
 * @apiGroup Setting
 * @apiParam {Number} settingId Id da montagem
 * @apiParam {Number} presentationId Id da apresentação
 * @apiSuccess {Object} setting Objeto com os dados da montagem
 */
routes.post("/removePresentation", authenticate(), validateRequest({
	settingId: JoiEntityId.required(),
	presentationId: JoiEntityId.required(),
}), wrapAsync(async (req, res) => {
	const { payload } = res.locals;
	const setting = await Setting.getById(payload.settingId);
	const presentation = await Presentation.getById(payload.presentationId);
	await setting.removePresentation(presentation);

	res.sendResult({ setting: await setting.getInfo() });
}));

/**
 * @api {post} /setting/delete Deleta uma montagem
 * @apiName delete
 * @apiGroup Setting
 * @apiParam {Number} settingId Id do teatro
 * @apiSuccess {Boolean} success Sucesso ao deletar
 */
routes.post("/delete", authenticate(), validateRequest({
	id: JoiEntityId.required(),
}), wrapAsync(async (req, res) => {
	const { payload } = res.locals;
	const setting = await SettingBaseRepo.findById(payload.id);
	if (!setting) throw new Error("ERR_API_SETTING_NOT_FOUND");
	await SettingBaseRepo.remove(setting);
	res.sendResult();
}));
