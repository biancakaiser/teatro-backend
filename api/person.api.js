/* eslint-disable linebreak-style */
/* eslint-disable indent */
const routes = require("express").Router();

const Joi = require("joi");
const RateLimit = require("express-rate-limit");

const Person = require("../_model/person.model");

const { wrapAsync, authenticate, validateRequest } = require("./middleware");
const { GenderEnum } = require("../entities/person.entity");
const {
  PersonBaseRepo,
  JobBaseRepo,
  RoleBaseRepo,
  ConceptionBaseRepo,
  CompanyBaseRepo,
  PlayBaseRepo,
  ResourceRelationBaseRepo,
  NationalityBaseRepo,
} = require("../repositories/repositories");
const ResourceRepository = require("../repositories/resource.repository");
const { Job } = require("../entities/job.entity");
const { Role } = require("../entities/role.entity");
const { JoiEntityId, makeDateTime } = require("../core/utils/general");

// ///////////////////////////////////////////////////////////////////////

const personAPILimiter = new RateLimit({
  windowMs: 5 * 60 * 1000, // 5 minute window
  max: 200, // requests per windowMs
  delayAfter: 100,
  delayMs: 1000,
});

routes.use(personAPILimiter);

// ///////////////////////////////////////////////////////////////////////

module.exports = routes;

/**
 * @api {post} /person/create Cria uma nova pessoa
 *
 * @apiName create
 * @apiGroup Person
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {Number} visible Visibilidade da pessoa
 * @apiParam {String} civilName Nome civil
 * @apiParam {String} artistName Nome artistico
 * @apiParam {String} gender Genêro da pessoa
 * @apiParam {String} race Raça da pessoa
 * @apiParam {Number} roleId <code>ID</code> da profissão principal
 * @apiParam {String} expertise Funções desempenhadas
 * @apiParam {Number} nationalityId Nacionalidade da pessoa
 * @apiParam {String} birthDate Data de aniversário
 * @apiParam {String} birthPlace Local de nascimento
 * @apiParam {String} deathDate Data da morte
 * @apiParam {String} deathPlace Local da morte
 * @apiParam {String} personalPath Descrição da vida pessoal
 * @apiParam {String} professionalPath Descrição da vida profissional
 * @apiParam {String} notes Notas sobre a pessoa
 * @apiParam {String} bibliography Bibliografia
 * @apiParam {String} citation Citações
 * @apiSuccess {Object} newPerson Objeto com os dados da pessoa
 */
routes.post(
  "/create",
  authenticate(),
  validateRequest({
    visible: Joi.number().allow(null),
    civilName: Joi.string().allow("", null),
    artistName: Joi.string().required(),
    gender: Joi.string().allow("", null),
    race: Joi.string().allow("", null),
    expertise: Joi.string().allow("", null),
    nationalityId: JoiEntityId.allow(null),
    roleId: JoiEntityId.allow(null),
    birthDate: Joi.string().allow("", null),
    birthPlace: Joi.string().allow("", null),
    deathDate: Joi.string().allow("", null),
    deathPlace: Joi.string().allow("", null),
    personalPath: Joi.string().allow("", null),
    professionalPath: Joi.string().allow("", null),
    notes: Joi.string().allow("", null),
    bibliography: Joi.string().allow("", null),
    citation: Joi.string().allow("", null),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const {
      visible, gender, race, ...data
    } = payload;
    let person = {
      visible: !!visible,
      gender: Object.values(GenderEnum).includes(gender) ? gender : null,
      race: race || null,
      ...data,
    };

    person = (await PersonBaseRepo.insert(person))[0];

    res.sendResult({ newPerson: person.sanitized() });
  }),
);

/**
 * @api {post} /person/getInfo Informações de uma pessoa
 * @apiName getInfo
 * @apiGroup Person
 * @apiParam {Number} personId <code>ID</code> da pessoa
 * @apiSuccess {Object} person Objeto com os dados da pessoa
 */
routes.post(
  "/getInfo",
  validateRequest({
    personId: JoiEntityId,
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    const foundPerson = await PersonBaseRepo.findById(payload.personId);
    if (!foundPerson) throw new Error("ERR_API_PERSON_NOT_FOUND");
    res.sendResult({ person: foundPerson.sanitized() });
  }),
);

/**
 * @api {post} /person/update Cria uma nova pessoa
 *
 * @apiName update
 * @apiGroup Person*
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {Number} personId <code>ID</code> da pessoa
 * @apiParam {Number} visible Visibilidade da pessoa
 * @apiParam {String} civilName Nome civil
 * @apiParam {String} artistName Nome artistico
 * @apiParam {String} gender Genêro da pessoa
 * @apiParam {String} race Raça da pessoa
 * @apiParam {Number} roleId <code>ID</code> da profissão principal
 * @apiParam {String} expertise Funções desempenhadas
 * @apiParam {String} nationality Nacionalidade da pessoa
 * @apiParam {String} birthDate Data de aniversário
 * @apiParam {String} deathDate Data da morte
 * @apiParam {String} deathPlace Local da morte
 * @apiParam {String} personalPath Descrição da vida pessoal
 * @apiParam {String} professionalPath Descrição da vida profissional
 * @apiParam {String} notes Notas sobre a pessoa
 * @apiParam {String} bibliography Bibliografia
 * @apiParam {String} citation Citações
 *
 * @apiSuccess {Object} person Objeto com os novos dados da pessoa
 */
routes.post(
  "/update",
  authenticate(),
  validateRequest({
    personId: JoiEntityId.required(),
    visible: Joi.number().max(1).allow(null),
    civilName: Joi.string().allow("", null),
    artistName: Joi.string().allow("", null),
    gender: Joi.string().allow("", null),
    race: Joi.string().allow("", null),
    roleId: JoiEntityId.allow(null),
    expertise: Joi.string().allow("", null),
    nationalityId: JoiEntityId.allow(null),
    birthDate: Joi.string().allow("", null),
    birthPlace: Joi.string().allow("", null),
    deathDate: Joi.string().allow("", null),
    deathPlace: Joi.string().allow("", null),
    personalPath: Joi.string().allow("", null),
    professionalPath: Joi.string().allow("", null),
    notes: Joi.string().allow("", null),
    bibliography: Joi.string().allow("", null),
    citation: Joi.string().allow("", null),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    let person = await PersonBaseRepo.findById(payload.personId);

    if (!person) throw new Error("ERR_API_PERSON_NOT_FOUND");

    Reflect.deleteProperty(payload, "personId");
    const { gender, race, ...data } = payload;

    Object.assign(person, data);

    person.gender = Object.values(GenderEnum).includes(gender) ? gender : null;
    person.race = race || null;
    person = await PersonBaseRepo.update(person, Object.keys(payload));

    res.sendResult({ person: person.sanitized() });
  }),
);

/**
 * @api {post} /person/uploadPicture/:personId Retorna informações de um teatro
 *
 * @apiName uploadPicture
 * @apiGroup Person
 *
 * @apiParam {Number} personId <code>ID</code> da pessoa
 *
 * @apiSuccess {String} url Url da foto
 */
routes.post(
  "/uploadPicture/:personId",
  authenticate(),
  wrapAsync(async (req, res) => {
    const { personId } = req.params;

    const person = await PersonBaseRepo.findById(personId);
    if (!person) throw new Error("ERR_API_PERSON_NOT_FOUND");

    const localSource = await ResourceRepository.saveLocal(req);
    const remoteSource = await ResourceRepository.saveRemote(localSource);

    await ResourceRelationBaseRepo.insert({ UUID: remoteSource.UUID, personId: person.id });

    res.sendResult({ UUID: remoteSource.UUID, url: remoteSource.URL });
  }),
);

/**
 * @api {post} /person/removePicture Remove fotos de uma pessoa
 *
 * @apiName removePicture
 * @apiGroup Person
 *
 * @apiParam {Number} personId <code>ID</code> da pessoa
 * @apiParam {String} UUID UUID da foto
 *
 * @apiSuccess {Boolean} success Confirmação de exclusão
 */
routes.post(
  "/removePicture",
  authenticate(),
  validateRequest({
    personId: JoiEntityId,
    UUID: Joi.string().required(),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const foundPerson = await Person.findById(payload.personId);
    await ResourceRepository.delete(payload.UUID);
    res.sendResult();
  }),
);

/**
 * @api {post} /person/delete Deleta uma pessoa
 *
 * @apiName delete
 * @apiGroup Person
 *
 * @apiParam {String} personId <code>ID</code> do teatro
 *
 * @apiSuccess {Boolean} success Sucesso ao deletar
 */
routes.post(
  "/delete",
  authenticate(),
  validateRequest({
    personId: JoiEntityId,
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const foundperson = await PersonBaseRepo.findById(payload.personId);
    if (!foundperson) throw new Error("ERR_API_PERSON_NOT_FOUND");
    await PersonBaseRepo.remove(foundperson);

    res.sendResult();
  }),
);

/**
 * @api {post} /person/addRole Adiciona um tipo a pessoa
 *
 * @apiName addRole
 * @apiGroup Person
 *
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {String} name Nome do tipo
 *
 * @apiSuccess {Boolean} success COnfirmação de sucesso
 */
routes.post(
  "/addRole",
  authenticate(),
  validateRequest({
    name: Joi.string().required(),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    let role = await RoleBaseRepo.findOne({ name: payload.name });
    if (!role) {
      role = (await RoleBaseRepo.insert(new Role({ name: payload.name })))[0];
    }

    const roleId = await Person.addRole(payload.name.toUpperCase());

    res.sendResult({ roleId });
  }),
);

/**
 * @api {post} /person/addJob Adiciona uma ocupação a pessoa
 * @apiName addJob
 * @apiGroup Person
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {String} firstDate Data de inicio
 * @apiParam {String} lastDate Data final
 * @apiParam {Number} personId <code>ID</code> da pessoa
 * @apiParam {Number} companyId <code>ID</code> da companhia
 * @apiParam {Number} roleId <code>ID</code> da ocupação
 * @apiSuccess {Number} jobId <code>ID</code> do novo trabalho
 * @apiError {String} ERR_API_PERSON_NOT_FOUND Pessoa não encontrada
 */
routes.post(
  "/addJob",
  authenticate(),
  validateRequest({
    firstDate: Joi.date().allow(null),
    lastDate: Joi.date().allow(null),
    personId: JoiEntityId,
    companyId: JoiEntityId,
    roleId: JoiEntityId,
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const person = await PersonBaseRepo.findById(payload.personId);
    if (!person) throw Error("ERR_API_PERSON_NOT_FOUND");

    const job = new Job({
      personId: payload.personId,
      companyId: payload.companyId,
      roleId: payload.roleId,
    });

    if (payload.firstDate) {
      job.firstDate = makeDateTime(payload.firstDate);
      job.firstDate.setHours(job.firstDate.getHours() + 4);
    }

    if (payload.lastDate) {
      job.lastDate = makeDateTime(payload.lastDate);
      job.lastDate.setHours(job.lastDate.getHours() + 4);
    }

    const { id: jobId } = (await JobBaseRepo.insert(job))[0];

    res.sendResult({ jobId });
  }),
);

/**
 * @api {post} /person/removeJob Remove um trabalho
 * @apiName removeJob
 * @apiGroup Person
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {Number} <code>ID</code> do job
 */
routes.post(
  "/removeJob",
  authenticate(),
  validateRequest({
    jobId: JoiEntityId,
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    await JobBaseRepo.remove({ id: payload.jobId });
    res.sendResult();
  }),
);

/**
 * @api {post} /person/updateJob Atualiza um trabalho
 * @apiName updateJob
 * @apiGroup Person
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {Number} <code>ID</code> do job
 */
routes.post(
  "/updateJob",
  authenticate(),
  validateRequest({
    jobId: JoiEntityId,
    firstDate: Joi.date().allow(null),
    lastDate: Joi.date().allow(null),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    if (payload.firstDate) {
      payload.firstDate = makeDateTime(payload.firstDate);
      payload.firstDate.setHours(payload.firstDate.getHours() + 4);
    }

    if (payload.lastDate) {
      payload.lastDate = makeDateTime(payload.lastDate);
      payload.lastDate.setHours(payload.lastDate.getHours() + 4);
    }

    await JobBaseRepo.update(
      {
        id: payload.jobId,
        firstDate: payload.firstDate,
        lastDate: payload.lastDate,
      },
      ["firstDate", "lastDate"],
    );
    res.sendResult();
  }),
);

/**
 * @api {post} /person/getRecord Retorna todas as informações sobre uma pessoa
 *
 * @apiName getRecord
 * @apiGroup Person
 *
 * @apiParam {Number} personId <code>ID</code> da pessoa
 *
 * @apiSuccess {Object} person Objeto com os dados da pessoa
 * @apiSuccess {Object} pictures Objeto com as urls das fotos da pessoa
 * @apiSuccess {Object} jobs Objeto com os dados dos trabalhos da pessoa
 *
 * @apiError {String} ERR_API_PERSON_NOT_FOUND Pessoa não encontrada
 */
routes.post(
  "/getRecord",
  validateRequest({
    personId: JoiEntityId,
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const foundPerson = await PersonBaseRepo.findById(payload.personId);
    if (!foundPerson) throw Error("ERR_API_PERSON_NOT_FOUND");

    const pictures = await ResourceRepository.findPictures(foundPerson);
    const foundJobs = await JobBaseRepo.find({ personId: foundPerson.id });
    const foundConceptions = await ConceptionBaseRepo.find({
      personId: foundPerson.id,
    });

    if (foundPerson.nationalityId) {
      const nationality = await NationalityBaseRepo.findById(foundPerson.nationalityId);
      foundPerson.nationality = nationality.name;
    }

    const jobs = [];
    if (foundJobs) {
      await Promise.all(
        foundJobs.map(async (job) => {
          if ([1, 3, 4, 5, 18, 21].indexOf(job.roleId) !== -1) return; // retira as concepcoes
          const newJob = job;
          const company = await CompanyBaseRepo.findById(job.companyId);
          const role = await RoleBaseRepo.findById(job.roleId);

          jobs.push({ ...newJob, company, role });
        }),
      );
    }

    const conceptions = [];
    await Promise.all(
      foundConceptions.map(async (conception) => {
        const newConception = conception;
        const play = await PlayBaseRepo.findById(conception.playId);
        const role = await RoleBaseRepo.findById(conception.roleId);

        conceptions.push({ ...newConception, play, role });
      }),
    );

    // eslint-disable-next-line object-curly-newline
    res.sendResult({
      person: foundPerson.sanitized(),
      pictures,
      conceptions,
      jobs,
    });
  }),
);

/**
 * @api {post} /person/getAll Retorna todas as pessoas
 *
 * @apiName getAll
 * @apiGroup Person
 *
 * @apiSuccess {Object} persons Objeto com as pessoas
 */
routes.post(
  "/getAll",
  wrapAsync(async (req, res) => {
    const persons = await PersonBaseRepo.find();

    res.sendResult({ persons: persons.map(person => person.sanitized()) });
  }),
);

/**
 * @api {post} /person/getAllNames Retorna todos os nomes e ids das pessoas
 * @apiName getAllNames
 * @apiGroup Person
 * @apiSuccess {Object} persons Objeto com os nomes e ids das pessoas
 */
routes.post(
  "/getAllNames",
  wrapAsync(async (req, res) => {
    const people = await PersonBaseRepo.find({}, [
      "id",
      "artistName",
      "civilName",
    ]);

    res.sendResult({
      people: people.map(({ id, artistName, civilName }) => ({
        id,
        artistName,
        civilName,
      })),
    });
  }),
);
