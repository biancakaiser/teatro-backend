/* eslint-disable linebreak-style */
/* eslint-disable indent */
const routes = require("express").Router();
const Joi = require("joi");
const RateLimit = require("express-rate-limit");

const { getConnection } = require("../core/database");
const BaseRepository = require("../core/base_repository");
const { PageModel } = require("../models/page.model");
const { getRemoteUrl, getLocalUrl, checkRemoteExistence } = require("../upload");

const { wrapAsync, authenticate, validateRequest } = require("./middleware");
const { UserRolesEnum } = require("../entities/user.entity");
const resourceRepository = require("../repositories/resource.repository.js");
const { environment } = require("../app_config.js");

const PageRepo = new BaseRepository(PageModel, getConnection());

const userAPILimiter = new RateLimit({
  windowMs: 5 * 60 * 1000, // 5 minute window
  max: 200, // requests per windowMms
  delayAfter: 100,
  delayMs: 1000,
});
routes.use(userAPILimiter);
module.exports = routes;

// Public
routes.post(
  "/all",
  wrapAsync(async (_req, res) => {
    const pages = await PageRepo.find({}, ["title", "id"]);

    res.sendResult({ pages: pages.map(page => page.noContent) });
  }),
);

routes.post(
  "/load",
  validateRequest({
    pageId: Joi.number().required(),
  }),
  wrapAsync(async (req, res) => {
    const { pageId } = res.locals.payload;
    const page = await PageRepo.findOne({ id: pageId }, [
      "title",
      "description",
      "content",
    ]);
    if (!page) throw new Error("ERR_NOT_FOUND");

    res.sendResult({ page: page.sanitized() });
  }),
);

// Admin

routes.post(
  "/create",
  authenticate([UserRolesEnum.ADMIN]),
  validateRequest({
    title: Joi.string().min(0).max(255).required(),
    description: Joi.string().min(0).max(255),
    content: Joi.string()
      .min(0)
      .max(10 * 1024 * 1024 /* Aproximadamente 10Mb */)
      .required(),
  }),
  wrapAsync(async (_req, res) => {
    const { payload } = res.locals;
    const page = (await PageRepo.insert({ ...payload }))[0];
    res.sendResult({ page });
  }),
);

routes.post(
  "/update",
  authenticate([UserRolesEnum.ADMIN]),
  validateRequest({
    pageId: Joi.alternatives().try(Joi.number(), Joi.string().min(1).max(16)),
    title: Joi.string().min(0).max(255).required(),
    description: Joi.string().min(0).max(255),
    content: Joi.string()
      .min(0)
      .max(10 * 1024 * 1024 /* Aproximadamente 10Mb */)
      .required(),
  }),
  wrapAsync(async (_req, res) => {
    const { payload } = res.locals;
    const { pageId, ...data } = payload;

    let page = await PageRepo.findById(pageId);
    if (!page) throw new Error("ERR_API_PAGE_NOT_FOUND");

    Object.assign(page, data);
    page = await PageRepo.update(page, Object.keys(data));

    res.sendResult({ page });
  }),
);

routes.post("/uploadImage", authenticate(), wrapAsync(async (req, res) => {
  const localSource = await resourceRepository.saveLocal(req, {}, 10);
  const remoteSource = await resourceRepository.saveRemote(localSource);

  const url = ["dev", "local"].includes(environment) ? getLocalUrl(localSource.fileName) : getRemoteUrl(remoteSource.fileName);

  res.sendResult({ url });
}));

routes.post(
  "/delete",
  authenticate([UserRolesEnum.ADMIN]),
  validateRequest({
    pageId: Joi.alternatives()
      .try(Joi.number(), Joi.string().min(1).max(16))
      .required(),
  }),
  wrapAsync(async (_req, res) => {
    const { payload } = res.locals;
    const { pageId } = payload;

    const page = await PageRepo.findById(pageId);
    if (!page) throw new Error("ERR_API_PAGE_NOT_FOUND");

    await PageRepo.remove(page);

    res.sendResult();
  }),
);

routes.post(
  "/findAll",
  authenticate([UserRolesEnum.ADMIN]),
  wrapAsync(async (_req, res) => {
    const pages = await PageRepo.find({}, [
      "title",
      "description",
      "id",
      "creationDate",
      "updatedDate",
    ]);

    res.sendResult({ pages: pages.map(page => page.sanitized()) });
  }),
);

routes.post(
  "/getInfo",
  validateRequest({
    pageId: Joi.alternatives()
      .try(Joi.number(), Joi.string().min(1).max(16))
      .required(),
  }),
  wrapAsync(async (_req, res) => {
    const { payload } = res.locals;
    const { pageId } = payload;

    const page = await PageRepo.findById(pageId);
    if (!page) throw new Error("ERR_NOT_FOUND");

    res.sendResult({ page });
  }),
);
