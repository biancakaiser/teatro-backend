const routes = require("express").Router();

const Joi = require("joi");
const RateLimit = require("express-rate-limit");

const Play = require("../_model/play.model.js");
const Resource = require("../_model/resource.model.js");

const { Conception } = require("../entities/conception.entity.js");

const { wrapAsync, authenticate, validateRequest } = require("./middleware");
const {
  PlayBaseRepo, PersonBaseRepo, RoleBaseRepo, ConceptionBaseRepo, SettingBaseRepo, LanguageBaseRepo, CompanyBaseRepo, NationalityBaseRepo, GenreBaseRepo, ResourceRelationBaseRepo,
} = require("../repositories/repositories.js");
const { JoiEntityId } = require("../core/utils/general.js");
const ResourceRepository = require("../repositories/resource.repository.js");

routes.use(
  new RateLimit({
    windowMs: 5 * 60 * 1000, // 5 minute window
    max: 200, // requests per windowMs
    delayAfter: 100,
    delayMs: 1000,
  }),
);

module.exports = routes;

/**
 * @api {post} /play/create Cria uma nova peça
 *
 * @apiName create
 * @apiGroup Play
 *
 * @apiParam {String} originalName Nome original da peça
 * @apiParam {String} globalFirstDate Data da primeira exibição mundial
 * @apiParam {String} spFirstDate Data da primeira exibição em SP
 * @apiParam {String} pressReleases Releases de imprensa
 * @apiParam {String} pressReviews Reviews na imprensa
 * @apiParam {String} bibliography Bibliografia
 * @apiParam {String} source Fonte
 * @apiParam {String} citation Citações
 * @apiParam {String} nationalityId Nacionalidade
 * @apiParam {String} languageId Idioma
 * @apiParam {String} genreId Gênero
 * @apiParam {String} authorId Autor do texto
 * @apiParam {Number} visible Define a visibilidade da peça
 * @apiParam {String} name Nome da peça
 *
 * @apiSuccess {Object} play Objeto com os dados da peça
 */
routes.post(
  "/create",
  authenticate(),
  validateRequest({
    name: Joi.string().max(255).required(),
    globalFirstDate: Joi.string().allow("", null),
    spFirstDate: Joi.string().allow("", null),
    pressReleases: Joi.string().allow("", null),
    pressReviews: Joi.string().allow("", null),
    bibliography: Joi.string().allow("", null),
    source: Joi.string().allow("", null),
    citation: Joi.string().allow("", null),
    nationalityId: JoiEntityId.allow(null),
    languageId: JoiEntityId.allow(null),
    genreId: JoiEntityId.allow(null),
    authorId: JoiEntityId.allow(null),
    visible: Joi.number().allow(null),
    originalName: Joi.string().allow("", null),
    referencePlay: Joi.string().allow("", null),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    const play = (await PlayBaseRepo.insert(payload))[0];

    res.sendResult({ play: play.sanitized() });
  }),
);

/**
 * @api {post} /play/getInfo Retorna os dados de uma peça
 *
 * @apiName getInfo
 * @apiGroup Play
 *
 * @apiParam {Number} playId Id da peça
 *
 * @apiSuccess {Object} play Objeto com os dados da peça
 */
routes.post(
  "/getInfo",
  authenticate(),
  validateRequest({
    playId: JoiEntityId.required(),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    const play = await PlayBaseRepo.findById(payload.playId);
    if (!play) throw new Error("ERR_API_PLAY_NOT_FOUND");
    res.sendResult({ play: play.sanitized() });
  }),
);

/**
 * @api {post} /play/update Altera os dados de uma peça
 *
 * @apiName update
 * @apiGroup Play
 *
 * @apiParam {Number} playId Id da peça
 * @apiParam {String} originalName Nome original da peça
 * @apiParam {String} globalFirstDate Data da primeira exibição mundial
 * @apiParam {String} spFirstDate Data da primeira exibição em SP
 * @apiParam {String} pressReleases Releases de imprensa
 * @apiParam {String} pressReviews Reviews na imprensa
 * @apiParam {String} bibliography Bibliografia
 * @apiParam {String} source Fonte
 * @apiParam {String} citation Citações
 * @apiParam {String} nationalityId Nacionalidade
 * @apiParam {String} languageId Idioma
 * @apiParam {String} genreId Gênero
 * @apiParam {String} authorId Autor do texto
 * @apiParam {Number} visible Define a visibilidade da peça
 * @apiParam {String} name Nome da peça
 * @apiParam {String} referencePlay Obra de referência
 *
 * @apiSuccess {Object} play Objeto com os dados da peça
 */
routes.post(
  "/update",
  authenticate(),
  validateRequest({
    playId: JoiEntityId,
    name: Joi.string().max(255).allow(""),
    globalFirstDate: Joi.string().allow("", null),
    spFirstDate: Joi.string().allow("", null),
    pressReleases: Joi.string().allow("", null),
    pressReviews: Joi.string().allow("", null),
    bibliography: Joi.string().allow("", null),
    source: Joi.string().allow("", null),
    citation: Joi.string().allow("", null),
    nationalityId: JoiEntityId.allow(null),
    languageId: JoiEntityId.allow(null),
    genreId: JoiEntityId.allow(null),
    authorId: JoiEntityId.allow(null),
    visible: Joi.number().allow(null),
    originalName: Joi.string().allow("", null),
    referencePlay: Joi.string().allow("", null),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    const { playId, ...data } = payload;

    let play = await PlayBaseRepo.findById(playId);
    if (!play) throw new Error("ERR_API_PLAY_NOT_FOUND");
    Object.assign(play, data);
    play = await PlayBaseRepo.update(play, Object.keys(data));

    res.sendResult({ play: play.sanitized() });
  }),
);

/**
 * @api {post} /play/addConception Adiciona uma concepção à peça
 *
 * @apiName addConception
 * @apiGroup Play
 * @apiParam {Number} playId Id da peça
 * @apiParam {Number} personId Id da membro de elenco
 * @apiParam {Number} roleId Papel do membro de elenco
 * @apiSuccess {Object} play Objeto com os dados da montagem
 */
routes.post(
  "/addConception",
  authenticate(),
  validateRequest({
    playId: JoiEntityId,
    personId: JoiEntityId,
    roleId: JoiEntityId,
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    const play = await PlayBaseRepo.findById(payload.playId);
    if (!play) throw new Error("ERR_API_PLAY_NOT_FOUND");
    const person = await PersonBaseRepo.findById(payload.personId);
    const role = await RoleBaseRepo.findById(payload.roleId);

    if (!person || !role) {
      throw new Error("ERR_API_NOT_FOUND");
    }

    const conception = (await ConceptionBaseRepo.insert(new Conception({
      playId: play.id,
      roleId: role.id,
      personId: person.id,
    })))[0];

    conception.person = person.sanitized();
    conception.role = role.sanitized();
    conception.play = play.sanitized();

    res.sendResult({ conception: conception.sanitized() });
  }),
);

/**
 * @api {post} /play/removeConception Remove um membro de elenco da montagem
 * @apiName removeConception
 * @apiGroup Play
 * @apiParam {Number} playId Id da peça
 * @apiParam {Number} conceptionId Id da membro de elenco
 * @apiSuccess {Object} play Objeto com os dados da montagem
 */
routes.post(
  "/removeConception",
  authenticate(),
  validateRequest({
    playId: JoiEntityId,
    conceptionId: JoiEntityId,
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    const play = await PlayBaseRepo.findById(payload.playId);
    if (!play) throw new Error("ERR_API_PLAY_NOT_FOUND");
    const conception = await ConceptionBaseRepo.findById(payload.conceptionId);
    if (conception) {
      await ConceptionBaseRepo.remove(conception);
    }
    res.sendResult({ play: play.sanitized() });
  }),
);

/**
 * @api {post} /play/delete Remove uma peça
 * @apiName delete
 * @apiGroup Play
 * @apiParam {Number} id Id da peça
 * @apiSuccess {Boolean} success Resultado da exclusão
 */
routes.post(
  "/delete",
  authenticate(),
  validateRequest({
    id: Joi.number().required(),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    const play = await PlayBaseRepo.findById(payload.id);
    if (!play) throw new Error("ERR_API_PLAY_NOT_FOUND");
    await PlayBaseRepo.remove(play);
    res.sendResult();
  }),
);

/**
 * @api {post} /play/getRecord Retorna todas as informações de uma peça
 * @apiName getRecord
 * @apiGroup Play
 * @apiParam {Number} playId <code>ID</code> do teatro
 * @apiSuccess {Object} play Objeto com os dados do teatro
 * @apiSuccess {Object} settings Objeto com todas as montagens da peça
 * @apiSuccess {Object} pictures Objeto com as urls das fotos da pessoa
 * @apiError {String} ERR_API_PLAY_NOT_FOUND Peça não encontrado
 */
routes.post(
  "/getRecord",
  validateRequest({
    playId: JoiEntityId,
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const play = await PlayBaseRepo.findById(payload.playId);
    if (!play) throw Error("ERR_API_PLAY_NOT_FOUND");

    const pictures = await ResourceRepository.findPictures(play);
    const foundSettings = await SettingBaseRepo.find({ playId: play.id });
    const settings = await Promise.all(
      foundSettings.map(async (setting) => {
        const language = ((await LanguageBaseRepo.findById(setting.languageId)) || { name: "" }).name;
        const company = await CompanyBaseRepo.findById(setting.companyId);
        return { ...setting, language, company };
      }),
    );

    const foundConceptions = await ConceptionBaseRepo.find({ playId: play.id });
    const conceptions = await Promise.all(
      foundConceptions.map(async (conception) => {
        const person = await PersonBaseRepo.findById(conception.personId);
        const role = await RoleBaseRepo.findById(conception.roleId);
        return { ...conception, person, role };
      }),
    );

    if (play.genreId) {
      play.genre = ((await GenreBaseRepo.findById(play.genreId)) || { name: "" }).name;
    }
    if (play.nationalityId) {
      play.nationality = ((await NationalityBaseRepo.findById(play.nationalityId)) || { name: "" }).name;
    }
    if (play.languageId) {
      play.language = ((await LanguageBaseRepo.findById(play.languageId)) || { name: "" }).name;
    }
    if (play.authorId) {
      play.author = await PersonBaseRepo.findById(play.authorId);
    }

    res.sendResult({
      play, settings, conceptions, pictures,
    });
  }),
);

/**
 * @api {post} /play/uploadPicture/:playId Retorna informações de um teatro
 *
 * @apiName uploadPicture
 * @apiGroup Play
 *
 * @apiParam {Number} playId <code>ID</code> da pessoa
 *
 * @apiSuccess {String} url Url da foto
 */
routes.post(
  "/uploadPicture/:playId",
  authenticate(),
  wrapAsync(async (req, res) => {
    const { playId } = req.params;

    const play = await PlayBaseRepo.findById(playId);
    if (!play) throw new Error("ERR_API_PLAY_NOT_FOUND");

    const localSource = await ResourceRepository.saveLocal(req);
    const remoteSource = await ResourceRepository.saveRemote(localSource);

    await ResourceRelationBaseRepo.insert({ UUID: remoteSource.UUID, playId: play.id });

    res.sendResult({ UUID: remoteSource.UUID, url: remoteSource.URL });
  }),
);

/**
 * @api {post} /play/removePicture Remove fotos de uma pessoa
 *
 * @apiName removePicture
 * @apiGroup Play
 *
 * @apiParam {Number} playId <code>ID</code> da pessoa
 * @apiParam {String} UUID UUID da foto
 *
 * @apiSuccess {Boolean} success Confirmação de exclusão
 */
routes.post(
  "/removePicture",
  authenticate(),
  validateRequest({
    playId: JoiEntityId,
    UUID: Joi.string().required(),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const play = await Play.findById(payload.playId);
    if (!play) throw new Error("ERR_API_PLAY_NOT_FOUND");

    await ResourceRelationBaseRepo.queryBuilder((qb) => {
      qb.where("playId", "=", play.id).delete();
    });

    res.sendResult();
  }),
);

/**
 * @api {post} /play/getAll Retorna todas as peças
 *
 * @apiName getAll
 * @apiGroup Play
 *
 * @apiSuccess {Object} plays Objeto com as peças
 */
routes.post(
  "/getAll",
  wrapAsync(async (req, res) => {
    const plays = await PlayBaseRepo.find();
    res.sendResult({ plays: plays.map(play => play.sanitized()) });
  }),
);
