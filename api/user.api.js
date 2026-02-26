const routes = require("express").Router();
const Joi = require("joi");
const RateLimit = require("express-rate-limit");

const general = require("../core/utils/general.js");
const { wrapAsync, authenticate, validateRequest } = require("./middleware");
const { Session } = require("../entities/session.entity");
const { UserRolesEnum } = require("../entities/user.entity");
const SessionRepository = require("../repositories/session.repository");
const UserRepository = require("../repositories/user.repository");

// ///////////////////////////////////////////////////////////////////////

const userAPILimiter = new RateLimit({
  windowMs: 5 * 60 * 1000, // 5 minute window
  max: 200, // requests per windowMms
  delayAfter: 100,
  delayMs: 1000,
});

routes.use(userAPILimiter);

// ///////////////////////////////////////////////////////////////////////

module.exports = routes;

/**
 * @api {post} /user/signup Realiza cadastro de um usuário
 * @apiVersion 1.0.0
 * @apiName Signup
 * @apiGroup User
 * @apiPermission none
 *
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {String} email E-mail do usuário
 * @apiParam {String} password Senha do usuário
 * @apiParam {String} firstName Primeiro nome do usuário
 * @apiParam {String} lastName Último nome do usuário
 * @apiParam {String} cpf CPF do usuário
 * @apiParam {String} dob Data de nascimento no formato yyyy-mm-dd
 *
 * @apiSuccess {Bool} success Confirmação do cadastro
 */
routes.post(
  "/signup",
  validateRequest({
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().max(100).required(),
    cpf: Joi.string().min(11).max(14).required(),
    dob: Joi.string().length(10).required(),
    role: Joi.string().allow("", null),
  }),
  wrapAsync(async (_req, res) => {
    const { payload: userData } = res.locals;
    try {
      await UserRepository.insert(userData);
    } catch (error) {
      if (error.code == "ER_DUP_ENTRY") {
        res.status(409).sendResult();
        return;
      }
      throw error; // jogar novamente o erro para o router fazer o handle
    }
    res.sendResult();
  }),
);

/**
 * @api {post} /user/login Realiza login de um usuário
 * @apiVersion 1.0.0
 * @apiName Login
 * @apiGroup User
 * @apiPermission none
 *
 * @apiParam {String} email E-mail do usuário
 * @apiParam {String} password Senha do usuário
 *
 * @apiSuccess {String} token Token de acesso
 * @apiSuccess {String} firstName Primeiro nome do usuário
 * @apiSuccess {String} lastName Último nome do usuário
 * @apiSuccess {String} role Tipo de usuário
 *
 * @apiSuccess {Bool} success Confirmação do login
 */
routes.post(
  "/login",
  validateRequest({
    email: Joi.string().email().required(),
    password: Joi.string().max(100).required(),
  }),
  wrapAsync(async (_req, res) => {
    const { payload } = res.locals;

    const user = await UserRepository.findByEmail(payload.email);
    const isPasswordValid = user ? (await user.validatePassword(payload.password, user.password)) : false;

    if (!isPasswordValid) {
      throw new Error("ERR_API_INCORRECT_EMAIL_OR_PASSWORD");
    }

    const [session] = await SessionRepository.insert(new Session({ user, creationDate: general.makeDateTime() }));

    res.cookie("token", session.token, {
      maxAge: 90 * 24 * 60 * 60 * 1000, // expires in 90 days
      httpOnly: true,
    });

    res.sendResult({
      token: session.token,
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  }),
);

/**
 * @api {post} /user/logout Realiza logout de um usuário
 * @apiVersion 1.0.0
 * @apiName Logout
 * @apiGroup User
 * @apiPermission user
 *
 * @apiParam {String} token Token de acesso do usuário
 *
 * @apiSuccess {Bool} success Confirmação do logout
 */
routes.post(
  "/logout",
  authenticate(),
  validateRequest({}),
  wrapAsync(async (_req, res) => {
    const { requestingUser, currentSession } = res.locals;
    await SessionRepository.remove({ id: currentSession.id });
    res.clearCookie("token");
    res.sendResult();
  }),
);

/**
 * @api {post} /user/getInfo Consulta informações do usuário
 * @apiVersion 1.0.0
 * @apiName GetInfo
 * @apiGroup User
 * @apiPermission user
 *
 *
 * @apiParam {String} token Token de acesso do usuário
 *
 * @apiSuccess {Object} user Dados do usuário
 * @apiSuccess {Bool} success Confirmação da consulta
 *
 */
routes.post(
  "/getInfo",
  authenticate(),
  validateRequest({}),
  wrapAsync(async (_req, res) => {
    const { requestingUser } = res.locals;
    const user = await UserRepository.findById(requestingUser.id);
    res.sendResult(user.sanitized());
  }),
);

/**
 * @api {post} /user/updateInfo Atualiza informações do usuário
 * @apiVersion 1.0.0
 * @apiName updateInfo
 * @apiGroup User
 * @apiPermission user
 *
 * @apiParam {String} firstName Primeiro nome do usuário
 * @apiParam {String} lastName Último nome do usuário
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {String} cpf CPF do usuário
 * @apiParam {String} dob Data de nascimento no formato yyyy-mm-dd
 *
 * @apiSuccess {Object} user Dados do usuário
 * @apiSuccess {Bool} success Confirmação da consulta
 *
 */
routes.post(
  "/updateInfo",
  authenticate(),
  validateRequest({
    userId: general.JoiEntityId,
    firstName: Joi.string().min(2).max(100),
    lastName: Joi.string().min(2).max(100),
    cpf: Joi.string().min(11).max(14),
    dob: Joi.string().length(10),
  }),
  wrapAsync(async (_req, res) => {
    const { requestingUser, payload } = res.locals;
    let user;
    // switch user if admin and userId was sent
    if ((await requestingUser.isAdmin()) && payload.userId) {
      user = await UserRepository.findById(payload.userId);
      payload.userId = undefined;
      delete payload.userId;
    } else {
      user = await UserRepository.findById(requestingUser.id);
    }
    // atualizar os campos
    Object.entries(payload).forEach(([key, value]) => {
      user[key] = value;
    });
    // atualizar a entidade
    user = await UserRepository.update(user, Object.keys(payload));

    res.sendResult(user.sanitized());
  }),
);

/**
 * @api {post} /user/changePassword Altera senha do usuário
 * @apiVersion 1.0.0
 * @apiName ChangePassword
 * @apiGroup User
 * @apiPermission user
 *
 *
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {String} currentPassword Senha atual
 * @apiParam {String} newPassword Nova senha
 *
 * @apiSuccess {Bool} success Confirmação da alteração de senha
 *
 */
routes.post(
  "/changePassword",
  authenticate(),
  validateRequest({
    newPassword: Joi.string().max(100).required(),
    currentPassword: Joi.string().max(100),
    userId: general.JoiEntityId,
  }),
  wrapAsync(async (_req, res) => {
    let user;
    const { requestingUser, payload } = res.locals;

    if ((await requestingUser.isAdmin()) && payload.userId) {
      user = await UserRepository.findById(payload.userId);
    } else {
      user = await UserRepository.findById(requestingUser.id);
      try {
        await user.validatePassword(payload.currentPassword);
      } catch (error) {
        throw Error("ERR_API_INCORRECT_CURRENT_PASSWORD");
      }
    }

    user.password = payload.newPassword;
    user = await UserRepository.update(user, ["password"]);

    res.sendResult(user);
  }),
);

/**
 * @api {post} /user/exclude Exclui um usuário
 *
 * @apiName exclude
 * @apiGroup User
 *
 * @apiParam {String} token Token de acesso do usuário
 * @apiParam {Number} userId <code>ID</code> do usuário a ser excluido
 *
 * @apiSuccess {Boolean} success Confirmação de sucesso
 */
routes.post(
  "/exclude",
  authenticate([UserRolesEnum.ADMIN]),
  validateRequest({
    userId: general.JoiEntityId.required(),
  }),
  wrapAsync(async (_req, res) => {
    const { payload } = res.locals;

    const user = await UserRepository.findById(payload.userId);

    await UserRepository.remove(user);

    res.sendResult();
  }),
);

/**
 * @api {post} /user/findAll Lista todos os usuários
 * @apiVersion 1.0.0
 * @apiName findAll
 * @apiGroup User
 * @apiPermission admin
 *
 *
 * @apiParam {String} token Token de acesso do usuário
 *
 * @apiSuccess {Object[]} users Lista de usuários
 * @apiSuccess {Bool} success Confirmação da consulta
 *
 */
routes.post(
  "/findAll",
  authenticate([UserRolesEnum.ADMIN]),
  validateRequest({}),
  wrapAsync(async (_req, res) => {
    const allUsers = await UserRepository.find({});

    res.sendResult({
      users: allUsers.map(user => user.sanitized()),
    });
  }),
);
