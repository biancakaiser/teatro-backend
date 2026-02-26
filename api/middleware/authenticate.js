const SessionRepository = require("../../repositories/session.repository");
const UserRepository = require("../../repositories/user.repository");

/**
 * @apiDefine user Usuário comum
  Usuário logado
 */
/**
 * @apiDefine admin Administrador
  Usuário administrador logado
 */
/**
 * @apiDefine none Público
  Usuário não logado
 */
module.exports =
  (authorizedRoles = null) =>
    async (req, res, next) => {
      let token = req.body.token || req.cookies.token;
      // if token is still not found, block request
      if (!token) {
        next(Error("UNAUTHORIZED"));
      }

      try {
        const session = await SessionRepository.findByToken(token);

        if (!session) {
          next(Error("FORBIDDEN"));
        } else {
          const isValidSession = await session.validateToken();
          const { user } = session;
          if (authorizedRoles === null || authorizedRoles.includes(user.role)) {
            res.locals.requestingUser = user;
            res.locals.currentSession = session;
            next();
          } else {
            next(Error("FORBIDDEN"));
          }
        }
      } catch (error) {
        next(Error("UNAUTHORIZED"));
      }
    };
