const routes = require("express").Router();

const Joi = require("joi");
const RateLimit = require("express-rate-limit");

const TheaterModel = require("../_model/theater.model");
const { Theater } = require("../entities/theater.entity");
const TheaterRepository = require("../repositories/theater.repository");
const ResourceRepository = require("../repositories/resource.repository");

const {
  PersonBaseRepo,
  ResourceBaseRepo,
  ResponsibleBaseRepo,
  RoleBaseRepo,
  TheaterBaseRepo,
  ResourceRelationBaseRepo,
} = require("../repositories/repositories");

const { wrapAsync, authenticate, validateRequest } = require("./middleware");
const { Responsible } = require("../entities/responsible.entity");
const { flattenEntities } = require("../core/utils/objects");
const { Person } = require("../entities/person.entity");
const { JoiEntityId } = require("../core/utils/general");

// ///////////////////////////////////////////////////////////////////////

const theaterAPILimiter = new RateLimit({
  windowMs: 5 * 60 * 1000, // 5 minute window
  max: 200, // requests per windowMs
  delayAfter: 100,
  delayMs: 1000,
});

routes.use(theaterAPILimiter);

// ///////////////////////////////////////////////////////////////////////

/**
 * @api {post} /theater/create Cria um novo teatro
 *
 * @apiName create
 * @apiGroup Theater
 *
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {String} name Nome do teatro
 * @apiParam {String} foundationAddress Endereço original
 * @apiParam {String} foundationDate Data de fundação
 * @apiParam {String} neighborhood Área do teatro
 * @apiParam {String} currentAddress Endereço atual
 * @apiParam {String} dissolutionDate Data do fechamento
 * @apiParam {String} dissolutionReason Razão para o fechamento
 * @apiParam {Number} seatsNumber Número de acentos
 * @apiParam {String} kind Tipo des estáculos
 * @apiParam {String} history Histórico do teatro
 * @apiParam {String} notes Anotações sobre o teatro
 * @apiParam {String} bibliography Bibliografia
 * @apiParam {String} otherNames Outros nomes para o teatro
 *
 * @apiSuccess {Object} newTheater Objeto com os dados do novo teatro
 */
routes.post(
  "/create",
  authenticate(),
  validateRequest({
    name: Joi.string().required(),
    foundationAddress: Joi.string().allow("", null),
    foundationDate: Joi.string().allow("", null),
    neighborhood: Joi.string().allow("", null),
    currentAddress: Joi.string().allow("", null),
    dissolutionDate: Joi.string().allow("", null),
    dissolutionReason: Joi.string().allow("", null),
    seatsNumber: Joi.string().allow("", null),
    kind: Joi.string().allow("", null),
    history: Joi.string().allow("", null),
    notes: Joi.string().allow("", null),
    bibliography: Joi.string().allow("", null),
    otherNames: Joi.string().allow("", null),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    const theater = (await TheaterBaseRepo.insert(payload))[0];

    res.sendResult({ newTheater: theater.sanitized() });
  }),
);

/**
 * @api {post} /theater/update Muda os dados de um teatro
 *
 * @apiName update
 * @apiGroup Theater
 *
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {String} name Nome do teatro
 * @apiParam {String} foundationAddress Endereço original
 * @apiParam {String} foundationDate Data de fundação
 * @apiParam {String} neighborhood Área do teatro
 * @apiParam {String} currentAddress Endereço atual
 * @apiParam {String} dissolutionDate Data do fechamento
 * @apiParam {String} dissolutionReason Razão para o fechamento
 * @apiParam {Number} seatsNumber Número de acentos
 * @apiParam {String} kind Tipo des estáculos
 * @apiParam {String} history Histórico do teatro
 * @apiParam {String} notes Anotações sobre o teatro
 * @apiParam {String} bibliography Bibliografia
 * @apiParam {String} otherNames Outros nomes para o teatro
 *
 * @apiSuccess {Object} theater Objeto com os dados atualizados do teatro
 */
routes.post(
  "/update",
  authenticate(),
  validateRequest({
    theaterId: JoiEntityId.required(),
    name: Joi.string().allow("", null),
    foundationAddress: Joi.string().allow("", null),
    foundationDate: Joi.string().allow("", null),
    neighborhood: Joi.string().allow("", null),
    currentAddress: Joi.string().allow("", null),
    dissolutionDate: Joi.string().allow("", null),
    dissolutionReason: Joi.string().allow("", null),
    seatsNumber: Joi.string().allow("", null),
    kind: Joi.string().allow("", null),
    history: Joi.string().allow("", null),
    notes: Joi.string().allow("", null),
    bibliography: Joi.string().allow("", null),
    otherNames: Joi.string().allow("", null),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    let theater = await TheaterRepository.findById(payload.theaterId);
    if (!theater) {
      throw new Error("ERR_API_THEATER_NOT_FOUND");
    }

    payload.theaterId = undefined;
    delete payload.theaterId;

    Object.entries(payload).forEach(
      ([key, value]) => (theater[key] = value),
    );
    theater = await TheaterRepository.update(theater);

    res.sendResult({ theater: theater.sanitized() });
  }),
);

/**
 * @api {post} /theater/addResponsible Adiciona um responsável pelo teatro
 *
 * @apiName addResponsible
 * @apiGroup Theater
 *
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {Number} theaterId <code>ID</code> do teatro
 * @apiParam {number} personId <code>ID</code> da pessoa responsável
 * @apiParam {String} firstDate Data de inicio da responsabilidade
 * @apiParam {String} lastDate Data final
 * @apiParam {String=["OWNER", "TENANT", "BUSINESS", "MANAGER", "COMPANY"]} role Qual a função do responsável
 * @apiParam {String} name Nome do responsável
 *
 * @apiSuccess {Object} newResponsible Objeto com dados do responsávelno período
 */
routes.post(
  "/addResponsible",
  authenticate(),
  validateRequest({
    theaterId: JoiEntityId,
    personId: JoiEntityId.allow(null),
    firstDate: Joi.string().allow("", null),
    lastDate: Joi.string().allow("", null),
    role: Joi.string().allow("", null),
    name: Joi.string().allow("", null),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const theater = await TheaterBaseRepo.findById(payload.theaterId);
    if (!theater) throw Error("ERR_NOT_FOUND");

    const basicInfo = Object.assign(payload);
    if (!payload.role) basicInfo.role = "TENANT";

    const responsible = await ResponsibleBaseRepo.insert(basicInfo);

    res.sendResult({ newResponsible: responsible });
  }),
);

/**
 * @api {post} /theater/removeResponsible Remove um responsável pelo teatro
 *
 * @apiName addResponsible
 * @apiGroup Theater
 *
 * @apiParam {String} token Token de acesso do usuário
 *  @apiParam {number} id Id do responsavel(responsabilidade)
 */
routes.post(
  "/removeResponsible",
  authenticate(),
  validateRequest({
    id: JoiEntityId.required(),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    await TheaterModel.removeResponsible(payload.id);
    res.sendResult();
  }),
);

/**
 * @api {post} /theater/getInfo Retorna informações de um teatro
 *
 * @apiName getInfo
 * @apiGroup Theater
 *
 * @apiParam {Number} theaterId <code>ID</code> do teatro
 *
 * @apiSuccess {Object} theaterInfo Objeto com os dados do teatro
 */
routes.post(
  "/getInfo",
  validateRequest({
    theaterId: JoiEntityId,
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const theater = await TheaterRepository.findById(payload.theaterId);
    if (!theater) {
      throw new Error("ERR_API_THEATER_NOT_FOUND");
    }

    res.sendResult({ theaterInfo: theater.sanitized() });
  }),
);

/**
 * @api {post} /theater/delete Deleta um teatro
 *
 * @apiName delete
 * @apiGroup Theater
 *
 * @apiParam {Number} theaterId <code>ID</code> do teatro
 *
 * @apiSuccess {Boolean} success Sucesso ao deletar
 */
routes.post(
  "/delete",
  authenticate(),
  validateRequest({
    theaterId: JoiEntityId,
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const theater = await TheaterRepository.findById(payload.theaterId);
    if (!theater) {
      throw new Error("ERR_API_THEATER_NOT_FOUND");
    }

    await TheaterRepository.remove(theater);

    res.sendResult();
  }),
);

/**
 * @api {post} /theater/uploadPicture/:theaterId Retorna informações de um teatro
 *
 * @apiName uploadPicture
 * @apiGroup Theater
 *
 * @apiParam {Number} theaterId <code>ID</code> do teatro
 *
 * @apiSuccess {String} url Url da foto
 */
routes.post(
  "/uploadPicture/:theaterId",
  authenticate(),
  wrapAsync(async (req, res) => {
    const { theaterId } = req.params;

    const theater = await TheaterBaseRepo.findById(theaterId);
    if (!theater) throw new Error("ERR_API_THEATER_NOT_FOUND");
    const localSource = await ResourceRepository.saveLocal(req);
    const remoteSource = await ResourceRepository.saveRemote(localSource);
    await ResourceRelationBaseRepo.insert({ UUID: remoteSource.UUID, theaterId: theater.id });
    res.sendResult({ UUID: remoteSource.UUID, url: remoteSource.URL });
  }),
);

/**
 * @api {post} /theater/removePicture Remove fotos de um teatro
 *
 * @apiName removePicture
 * @apiGroup Theater
 *
 * @apiParam {Number} theaterId <code>ID</code> do teatro
 * @apiParam {String} UUID UUID da foto
 *
 * @apiSuccess {Boolean} success Confirmação de exclusão
 */
routes.post(
  "/removePicture",
  authenticate(),
  validateRequest({
    theaterId: JoiEntityId,
    UUID: Joi.string().required(),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const foundTheater = await TheaterBaseRepo.findById(payload.theaterId);
    if (!foundTheater) throw new Error("ERR_API_THEATER_NOT_FOUND");
    await ResourceRepository.delete(payload.UUID);
    res.sendResult();
  }),
);

/**
 * @api /theater/getAll Retorna todos os teatros
 *
 * @apiName getAll
 * @apiGroup Theater
 *
 * @apiSuccess {Object} theaters Objeto com as infrmações de todos os teatros cadastrados
 */
routes.post(
  "/getAll",
  wrapAsync(async (req, res) => {
    const foundTheaters = await TheaterRepository.find({});

    res.sendResult({
      theaters: foundTheaters.map(theater => theater.sanitized()),
    });
  }),
);

/**
 * @api {post} /theater/getRecord Retorna todas as informações de um teatro
 * @apiName getRecord
 * @apiGroup Theater
 * @apiParam {Number} theaterId <code>ID</code> do teatro
 * @apiSuccess {Object} theater Objeto com os dados do teatro
 * @apiSuccess {Object} pictures Objeto com os dados e url das fotos do teatro
 * @apiSuccess {Object} responsibles Objeto com todos que já foram responsaveis pelo teatro
 * @apiError {String} ERR_API_THEATER_NOT_FOUND Teatro não encontrado
 */
routes.post(
  "/getRecord",
  validateRequest({
    theaterId: JoiEntityId,
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    const theater = await TheaterRepository.findById(payload.theaterId);
    if (!theater) throw Error("ERR_API_THEATER_NOT_FOUND");

    const [pictures, responsiblesList] = await Promise.all([
      ResourceRepository.findPictures(theater),
      ResponsibleBaseRepo.queryBuilder((qb) => {
        qb.where("theaterId", "=", theater.id)
          .select(
            ResponsibleBaseRepo.tableColumns //
              .filter(col => !["creationDate", "updatedDate"].includes(col)) //
              .map(col => `${ResponsibleBaseRepo.tableName}.${col}`),
          )
          .innerJoin(`${PersonBaseRepo.tableName} as person`, {
            personId: "person.id",
          })
          .select(
            PersonBaseRepo.tableColumns //
              .filter(col => !["creationDate", "updatedDate"].includes(col)) //
              .map(col => `person.${col} as person_${col}`),
          );
      }),
    ]);

    const responsibles = responsiblesList.map((data) => {
      const responsible = flattenEntities(data);
      responsible.person = new Person(responsible.person).sanitized();
      return new Responsible(responsible).sanitized();
    });

    res.sendResult({
      theater: theater.sanitized(),
      pictures: pictures.map(picture => picture.sanitized()),
      responsibles,
    });
  }),
);

module.exports = routes;
