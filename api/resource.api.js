const routes = require("express").Router();

const Joi = require("joi");
const RateLimit = require("express-rate-limit");
const path = require("path");
const Resource = require("../_model/resource.model.js");

const { wrapAsync, authenticate, validateRequest } = require("./middleware");

// ///////////////////////////////////////////////////////////////////////

const resourceAPILimiter = new RateLimit({
  windowMs: 5 * 60 * 1000, // 5 minute window
  max: 200, // requests per windowMs
  delayAfter: 100,
  delayMs: 1000,
});

routes.use(resourceAPILimiter);

// ///////////////////////////////////////////////////////////////////////

module.exports = routes;

/**
 * @api {post} /resource/uploadLocal Realiza um upload de arquivo
 * @apiVersion 1.0.0
 * @apiName Upload Local file
 * @apiGroup Resource
 * @apiPermission user
 *
 * @apiParam {String} token Token de acesso do usuário
 *
 * @apiSuccess {String} location - Diretório do arquivo
 */
routes.post(
  "/uploadLocal",
  authenticate(),
  wrapAsync(async (req, res) => {
    const resource = await Resource.saveLocal(req);
    res.sendResult(await resource.getInfo(["fileName"]));
  }),
);

/**
 * @api {post} /resource/uploadRemote Realiza um upload de arquivo local e remoto
 * @apiVersion 1.0.0
 * @apiName Upload Remote file
 * @apiGroup Resource
 * @apiPermission user
 *
 * @apiParam {String} token Token de acesso do usuário
 *
 * @apiSuccess {String} location - Diretório do arquivo
 */
routes.post(
  "/uploadRemote",
  authenticate(),
  wrapAsync(async (req, res) => {
    const localResource = await Resource.saveLocal(req, {}, 10);
    const remoteResource = await Resource.saveRemote(localResource);

    res.sendResult(await remoteResource.getInfo(["fileName"]));
  }),
);

/**
 * @api {post} /resource/getUrl Consulta a url de um arquivo
 * @apiVersion 1.0.0
 * @apiName Get file url
 * @apiGroup Resource
 * @apiPermission user
 *
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {String} fileName Nome do arquivo
 *
 * @apiSuccess {String} fileUrl - Link do arquivo
 */
routes.post(
  "/getUrl",
  authenticate(),
  validateRequest({
    fileName: Joi.string().max(50).required(),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    const resourceUrl = await Resource.getUrl(payload.fileName);

    res.sendResult({ fileUrl: resourceUrl });
  }),
);

/**
 * @api {post} /resource/remove Remove registro de um arquivo
 * @apiVersion 1.0.0
 * @apiName Remove file
 * @apiGroup Resource
 * @apiPermission admin
 *
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {String} fileName Nome do arquivo
 *
 * @apiSuccess {Bool} success
 */
routes.post(
  "/remove",
  authenticate(["ADMIN"]),
  validateRequest({
    fileName: Joi.string().max(50).required(),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    await Resource.remove(payload.fileName);

    res.sendResult();
  }),
);

/**
 * @api {post} /resource/updateInfo Atualiza informações de um arquivo
 * @apiVersion 1.0.0
 * @apiName updateInfo
 * @apiGroup Resource
 * @apiPermission admin
 *
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {String} description Descrição
 * @apiParam {String} origin Fonte
 *
 * @apiSuccess {Bool} success
 */
routes.post(
  "/updateInfo",
  authenticate(),
  validateRequest({
    UUID: Joi.string().max(255).required(),
    description: Joi.string().allow("", null),
    origin: Joi.string().allow("", null),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    await Resource.updateInfo(
      payload.UUID,
      payload.description,
      payload.origin,
    );
    res.sendResult();
  }),
);

/**
 * @api {post} /resource/getInfo Atualiza informações de um arquivo
 * @apiVersion 1.0.0
 * @apiName getInfo
 * @apiGroup Resource
 * @apiPermission admin
 *
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {String} fileName Nome do arquivo
 *
 * @apiSuccess {Bool} success
 */
routes.post(
  "/getInfo",
  authenticate(),
  validateRequest({
    UUID: Joi.string().max(255).required(),
  }),
  wrapAsync(async (req, res) => {
    const { payload } = res.locals;
    const resources = await Resource.findByUUID(payload.UUID);
    if (resources.length === 0) {
      throw Error("ERR_NOT_FOUND");
    }
    res.sendResult({
      description: resources[0].description,
      origin: resources[0].origin,
    });
  }),
);

/**
 * @api {get} /resource/:fileName Faz uma requisição de um arquivo
 * @apiVersion 1.0.0
 * @apiName Get file
 * @apiGroup Resource
 * @apiPermission user
 *
 * @apiParam {String} token Token de acesso do usuário
 *
 * @apiSuccess {file} file - Arquivo
 */
routes.get(
  "/:fileName",
  wrapAsync(async (req, res) => {
    const { fileName } = req.params;
    const filePath = path.resolve("./temp_uploads/", fileName);
    res.sendFile(filePath);
  }),
);
