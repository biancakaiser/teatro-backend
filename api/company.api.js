/* eslint-disable linebreak-style */
/* eslint-disable indent */
const routes = require("express").Router();

const Joi = require("joi");
const RateLimit = require("express-rate-limit");

const {
  CompanyBaseRepo, ResourceRelationBaseRepo, JobBaseRepo, PersonBaseRepo,
  NationalityBaseRepo,
  RoleBaseRepo,
} = require("../repositories/repositories.js");
const ResourceRepository = require("../repositories/resource.repository.js");

const { wrapAsync, authenticate, validateRequest } = require("./middleware");
const { JoiEntityId } = require("../core/utils/general.js");

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
 * @api {post} /company/create Cria uma nova companhia
 * @apiName create
 * @apiGroup Company*
 * @apiParam {String} name Nome
 * @apiParam {String} otherNames Nomes alternativos
 * @apiParam {Number} nationalityId Nacionalidade
 * @apiParam {String} foundationDate Data de fundação
 * @apiParam {String} foundationPlace Local de fundação
 * @apiParam {String} dissolutionDate Data de dissolução
 * @apiParam {String} path Trajetória
 * @apiParam {String} notes Notas
 * @apiParam {String} bibliography Bibliografia
 * @apiParam {String} citation Citações
 * @apiParam {Number} visible Define se a compnhia vai ser visivel
 * @apiSuccess {Object} company Objeto com os dados da companhia
 */
routes.post(
  "/create",
  authenticate(),
  validateRequest({
    name: Joi.string().max(255).required(),
    otherNames: Joi.string().max(255).allow(""),
    nationalityId: JoiEntityId.allow(null),
    foundationDate: Joi.string().allow("", null),
    foundationPlace: Joi.string().max(255).allow(""),
    dissolutionDate: Joi.string().allow("", null),
    path: Joi.string().allow("", null),
    notes: Joi.string().allow("", null),
    bibliography: Joi.string().allow("", null),
    citation: Joi.string().allow("", null),
    visible: Joi.number().allow(null),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    const company = (await CompanyBaseRepo.insert(payload))[0];

    res.sendResult({ company: company.sanitized() });
  }),
);

/**
 * @api {post} /company/getInfo Retorna os dados de uma companhia
 * @apiName getInfo
 * @apiGroup Company
 * @apiParam {Number} id Id da companhia
 * @apiSuccess {Object} company Objeto com os dados da companhia
 */
routes.post(
  "/getInfo",
  authenticate(),
  validateRequest({
    id: JoiEntityId,
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    const company = await CompanyBaseRepo.findById(payload.id);
    if (!company) throw new Error("ERR_API_COMPANY_NOT_FOUND");
    res.sendResult({ company: company.sanitized() });
  }),
);

/**
 * @api {post} /company/update Altera os dados de uma companhia
 *
 * @apiName update
 * @apiGroup Company
 * @apiParam {Number} id Id da companhia
 * @apiParam {String} name Nome
 * @apiParam {String} otherNames Nomes alternativos
 * @apiParam {Number} nationalityId Nacionalidade
 * @apiParam {String} foundationDate Data de fundação
 * @apiParam {String} foundationPlace Local de fundação
 * @apiParam {String} dissolutionDate Data de dissolução
 * @apiParam {String} path Trajetória
 * @apiParam {String} notes Notas
 * @apiParam {String} bibliography Bibliografia
 * @apiParam {String} citation Citações
 * @apiParam {Number} visible Define se a compnhia vai ser visivel
 * @apiSuccess {Object} company Objeto com os dados da companhia
 */
routes.post(
  "/update",
  authenticate(),
  validateRequest({
    id: JoiEntityId,
    name: Joi.string().max(255).required(),
    otherNames: Joi.string().max(255).allow(""),
    nationalityId: JoiEntityId.allow(null),
    foundationDate: Joi.string().allow("", null),
    foundationPlace: Joi.string().max(255).allow(""),
    dissolutionDate: Joi.string().allow("", null),
    path: Joi.string().allow("", null),
    notes: Joi.string().allow("", null),
    bibliography: Joi.string().allow("", null),
    citation: Joi.string().allow("", null),
    visible: Joi.number().allow(null),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const { id, ...data } = payload;
    let company = await CompanyBaseRepo.findById(id);
    if (!company) throw new Error("ERR_API_COMPANY_NOT_FOUND");
    Object.assign(company, data);
    company = await CompanyBaseRepo.update(company, Object.keys(data));

    res.sendResult({ company: company.sanitized() });
  }),
);

/**
 * @api {post} /company/delete Remove uma companhia
 * @apiName delete
 * @apiGroup Company
 * @apiParam {Number} id Id da companhia
 * @apiSuccess {Boolean} success Resultado da exclusão
 */
routes.post(
  "/delete",
  authenticate(),
  validateRequest({
    id: JoiEntityId,
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    const company = await CompanyBaseRepo.findById(payload.id);
    await CompanyBaseRepo.remove(company);
    res.sendResult();
  }),
);

/**
 * @api {post} /company/uploadPicture/:companyId Retorna informações de um teatro
 * @apiName uploadPicture
 * @apiGroup Theater
 * @apiParam {Number} companyId <code>ID</code> do teatro
 * @apiSuccess {String} url Url da foto
 */
routes.post(
  "/uploadPicture/:companyId",
  authenticate(),
  wrapAsync(async (req, res) => {
    const { companyId } = req.params;

    const company = await CompanyBaseRepo.findById(companyId);
    if (!company) throw new Error("ERR_API_COMPANY_NOT_FOUND");
    const localSource = await ResourceRepository.saveLocal(req);
    const remoteSource = await ResourceRepository.saveRemote(localSource);
    await ResourceRelationBaseRepo.insert({ UUID: remoteSource.UUID, companyId: company.id });
    res.sendResult({ UUID: remoteSource.UUID, url: remoteSource.URL });
  }),
);

/**
 * @api {post} /company/removePicture Remove fotos de uma companhia
 * @apiName removePicture
 * @apiGroup Company
 * @apiParam {Number} companyId <code>ID</code> da pessoa
 * @apiParam {String} UUID UUID da foto
 * @apiSuccess {Boolean} success Confirmação de exclusão
 */
routes.post(
  "/removePicture",
  authenticate(),
  validateRequest({
    companyId: JoiEntityId,
    UUID: Joi.string().required(),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const foundCompany = await CompanyBaseRepo.findById(payload.companyId);
    if (!foundCompany) throw new Error("ERR_API_COMPANY_NOT_FOUND");
    await ResourceRepository.delete(payload.UUID);
    res.sendResult();
  }),
);

/**
 * @api {post} /company/getRecord Retorna os dados de uma companhia
 *
 * @apiName getRecord
 * @apiGroup Company
 *
 * @apiParam {Number} companyId <code>ID</code> da companhia
 *
 * @apiSuccess {Object} company Dados da companhia
 * @apiSuccess {Object} pictures Objeto com todas as fotos e sua informações
 * @apiSuccess {Object} jobs Objeto com os dados dos trabalhos e pessoas que o executaram
 *
 * @apiError {String} ERR_API_COMPANY_NOT_FOUND Companhia não encontrada
 */
routes.post(
  "/getRecord",
  validateRequest({
    companyId: JoiEntityId,
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;

    const foundCompany = await CompanyBaseRepo.findById(payload.companyId);
    if (!foundCompany) throw Error("ERR_API_COMPANY_NOT_FOUND");

    const foundJobs = await JobBaseRepo.find({
      companyId: foundCompany.id,
    });
    const jobs = [];

    await Promise.all(
      foundJobs.map(async (job) => {
        const jobInfo = JSON.parse(JSON.stringify(job));
        const foundPerson = job.personId ? await PersonBaseRepo.findById(job.personId) : null;
        const foundRole = job.roleId ? await RoleBaseRepo.findById(job.roleId) : null;
        const nationality = foundPerson && foundPerson.nationalityId ? await NationalityBaseRepo.findById(foundPerson.nationalityId) : null;

        const person = foundPerson ? {
          ...foundPerson,
          nationality: nationality ? nationality.name : null,
          role: foundRole ? foundRole.name : null,
        } : null;

        jobs.push({ ...jobInfo, person });
      }),
    );

    if (foundCompany.nationalityId) {
      const nationality = await NationalityBaseRepo.findById(foundCompany.nationalityId);
      foundCompany.nationality = nationality.name;
    }

    const pictures = await ResourceRepository.findPictures(foundCompany);

    res.sendResult({ company: foundCompany, pictures, jobs });
  }),
);

/**
 * @api {post} /company/getAll Retorna todas as companhia
 *
 * @apiName getAll
 * @apiGroup Company
 *
 * @apiSuccess {Object} companys Objeto com as companhias
 */
routes.use(
  "/getAll",
  wrapAsync(async (req, res) => {
    const companys = await CompanyBaseRepo.find();

    res.sendResult({ companys: companys.map(company => company.sanitized()) });
  }),
);
