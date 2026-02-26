const routes = require("express").Router();
const RateLimit = require("express-rate-limit");
const Joi = require("joi");

const { wrapAsync, authenticate, validateRequest } = require("./middleware");
const {
  GenreBaseRepo,
  RoleBaseRepo,
  NationalityBaseRepo,
  LanguageBaseRepo,
  PersonBaseRepo,
  CompanyBaseRepo,
  TheaterBaseRepo,
  PlayBaseRepo,
  JobBaseRepo,
  ResourceBaseRepo,
  ResponsibleBaseRepo,
} = require("../repositories/repositories.js");
const { getConnection } = require("../core/database.js");
const { JoiEntityId } = require("../core/utils/general.js");
const { getRemoteUrl } = require("../upload.js");
const { UserRolesEnum } = require("../entities/user.entity.js");

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

const availableModels = {
  Genre: GenreBaseRepo,
  Role: RoleBaseRepo,
  Nationality: NationalityBaseRepo,
  Language: LanguageBaseRepo,
};

const getClass = (className) => {
  if (className in availableModels) {
    return availableModels[className];
  }
  throw Error(`Invalid class ${className}`);
};

/**
 * @api {post} /lists/add Adiciona a uma lista
 *
 * @apiName add
 * @apiGroup Lists
 *
 * @apiparam {String} listName Nome da lista
 *
 * @apiParam {String} name Nome da nova entrada
 *
 * @apiSuccess {Object} role Objeto com os dados do papel
 */
routes.post(
  "/add",
  authenticate(),
  validateRequest({
    listName: Joi.string().valid(Object.keys(availableModels)).required(),
    name: Joi.string().max(255).required(),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const entity = await getClass(payload.listName).insert({
      name: payload.name,
    });

    res.sendResult({ entity });
  }),
);

routes.post(
  "/updateSponsor",
  authenticate(),
  validateRequest({
    id: JoiEntityId,
    UUID: Joi.string().required(),
    description: Joi.string().allow(""),
    origin: Joi.string().max(255).allow(""),
    url: Joi.string().max(255).allow(""),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const { id, description, origin } = payload;
    let sponsor = await ResourceRepository.findById(id);
    if (!sponsor) {
      throw new Error("ERR_NOT_FOUND");
    }
    sponsor.origin = origin;
    sponsor.description = description;
    sponsor = await ResourceRepository.update(sponsor, [
      "description",
      "origin",
    ]);

    res.sendResult({});
  }),
);

routes.post(
  "/listSponsors",
  authenticate(),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const sponsors = await ResourceBaseRepo.find({
      sponsor: true,
      private: false,
    });
    res.sendResult({
      sponsors: sponsors.map(({
        origin, URL, description, UUID, id,
      }) => ({
        origin,
        url: URL,
        description,
        UUID,
        id,
      })),
    });
  }),
);

routes.post(
  "/uploadSponsorPicture",
  authenticate(),
  wrapAsync(async (req, res) => {
    const localSource = await ResourceRepository.saveLocal(req);
    localSource.sponsor = 1;
    const remoteSource = await ResourceRepository.saveRemote(localSource);

    res.sendResult({
      id: remoteSource.id,
      UUID: remoteSource.UUID,
      url: remoteSource.URL,
    });
  }),
);

routes.post(
  "/deleteSponsor/:id",
  authenticate([UserRolesEnum.ADMIN]),
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const sponsor = await ResourceBaseRepo.findById(id);
    if (!sponsor) {
      throw new Error("ERR_NOT_FOUND");
    }
    await ResourceBaseRepo.remove(sponsor);

    res.sendResult();
  }),
);

/**
 * @api {post} /lists/update Altera o valor de uma entrada da lista
 * @apiName update
 * @apiGroup Lists
 * @apiparam {String} listName Nome da lista
 * @apiParam {Number} id Id da entrada
 * @apiParam {Number} name Novo nome da entrada
 * @apiSuccess {Object} role Objeto com os dados da papel
 */
routes.post(
  "/update",
  authenticate(),
  validateRequest({
    listName: Joi.string().valid(Object.keys(availableModels)).required(),
    id: JoiEntityId,
    name: Joi.string().max(255).required(),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    const entity = await getClass(payload.listName).update(
      { id: payload.id, name: payload.name },
      ["name"],
    );
    res.sendResult(entity.sanitized());
  }),
);

/**
 * @api {post} /lists/delete Remove uma entrada de uma lista
 * @apiName delete
 * @apiGroup Lists
 * @apiparam {String} listName Nome da lista
 * @apiParam {Number} id Id do elemento a ser removido
 * @apiSuccess {Boolean} success Resultado da exclusão
 */
routes.post(
  "/delete",
  authenticate(),
  validateRequest({
    listName: Joi.string().valid(Object.keys(availableModels)).required(),
    id: JoiEntityId,
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const entity = await getClass(payload.listName).findById(payload.id);
    if (!entity) throw new Error("ERR_NOT_FOUND");
    await getClass(payload.listName).remove(entity);

    res.sendResult();
  }),
);

/**
 * @api {post} /lists/getEntries Lista as entradas de uma lista
 * @apiName getEntries
 * @apiGroup Lists
 * @apiparam {String} listName Nome da lista
 * @apiSuccess {Object} entries Entradas da lista
 */
routes.post(
  "/getEntries",
  authenticate(),
  validateRequest({
    listName: Joi.string().valid(Object.keys(availableModels)).required(),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const entities = await getClass(payload.listName).find({});

    res.sendResult({ entries: entities.map(entity => entity.sanitized()) });
  }),
);

/**
 * @api {post} /lists/getSearchEntries Lista as entradas necessárias para a busca de peças
 * @apiName getSearchEntries
 * @apiGroup Lists
 * @apiSuccess {Object} entries Entradas da lista
 */
routes.post(
  "/getSearchEntries",
  wrapAsync(async (req, res) => {
    const [
      genres,
      roles,
      nationalities,
      languages,
      companies,
      theaters,
      plays,
      personJobList,
    ] = await Promise.all([
      GenreBaseRepo.find({}, ["id", "name"]),
      RoleBaseRepo.find({}, ["id", "name"]),
      NationalityBaseRepo.find({}, ["id", "name"]),
      LanguageBaseRepo.find({}, ["id", "name"]),
      CompanyBaseRepo.find({}, ["id", "name"]),
      TheaterBaseRepo.find({}, ["id", "name"]),
      PlayBaseRepo.find({}, ["id", "name"]),
      PersonBaseRepo.queryBuilder((qb) => {
        qb.select(`${PersonBaseRepo.tableName}.id`, "artistName as name")
          .innerJoin(`${RoleBaseRepo.tableName} as Role`, { roleId: "Role.id" })
          .select("Role.name as role")
          .orderBy("artistName")
          .groupBy("id", "role");
      }),
    ]);

    const jobs = personJobList.reduce((previous, current) => {
      if (!(current.role in previous)) previous[current.role] = [];
      previous[current.role].push({ id: current.id, name: current.name });
      return previous;
    }, {});

    res.sendResult({
      genres: genres.map(item => item.sanitized()),
      roles: roles.map(item => item.sanitized()),
      nationalities: nationalities.map(item => item.sanitized()),
      languages: languages.map(item => ({ id: item.id, name: item.name })),
      companies: companies.map(item => ({ id: item.id, name: item.name })),
      theaters: theaters.map(item => ({ id: item.id, name: item.name })),
      plays: plays.map(item => ({ id: item.id, name: item.name })),
      jobs,
    });
  }),
);

/**
 * @api {post} /lists/getNationalitiesPresentation Lista as entradas necessárias para a busca de peças
 * @apiName getNationalitiesPresentation
 * @apiGroup Lists
 * @apiSuccess {Object} nationalitiesPresentation Nacionalidades da lista
 */
routes.post(
  "/getNationalitiesPresentation",
  wrapAsync(async (req, res) => {
    const nationalitiesPlay = await getConnection()("Play")
      .select(
        "Play.nationalityId as nationalityId",
        "Nationality.name as nationalityName",
      )
      .join("Nationality", "Nationality.id", "=", "Play.nationalityId")
      .groupBy("nationalityId", "nationalityName");

    const nationalitiesCompany = await getConnection()("Company")
      .select(
        "Company.nationalityId as nationalityId",
        "Nationality.name as nationalityName",
      )
      .join("Nationality", "Nationality.id", "=", "Company.nationalityId")
      .groupBy("nationalityId", "nationalityName");

    const nationalitiesPresentation = {
      nationalitiesPlay,
      nationalitiesCompany,
    };

    res.sendResult(nationalitiesPresentation);
  }),
);

/**
 * @api {post} /lists/getNationalitiesPerson Lista as entradas necessárias para a busca de peças
 * @apiName getNationalitiesPerson
 * @apiGroup Lists*
 * @apiSuccess {Object} nationalitiesPerson Nacionalidades da lista
 */
routes.post(
  "/getNationalitiesPerson",
  wrapAsync(async (req, res) => {
    const nationalitiesPersonSearch = await getConnection()("Person")
      .select(
        "Person.nationalityId as nationalityId",
        "Nationality.name as nationalityName",
      )
      .join("Nationality", "Nationality.id", "=", "Person.nationalityId")
      .groupBy("nationalityId", "nationalityName");

    const nationalitiesPerson = {
      nationalitiesPerson: nationalitiesPersonSearch,
    };

    res.sendResult(nationalitiesPerson);
  }),
);

routes.post(
  "/getSponsors",
  wrapAsync(async (req, res) => {
    const sponsors = await ResourceBaseRepo.find({
      sponsor: true,
    });

    res.sendResult({
      sponsors: sponsors.map(sponsor => ({
        url: sponsor.URL,
        description: sponsor.description,
        origin: sponsor.origin,
      })),
    });
  }),
);
