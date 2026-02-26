const statusRoutes = require("express").Router();
const appConfig = require("../app_config.js");
const { wrapAsync } = require("./middleware");
const { getConnection } = require("../core/database.js");

/**
 * @api {get} / Retorna o status de funcionamento do servidor
 * @apiVersion 1.0.0
 * @apiName GetStatus
 * @apiGroup Status
 * @apiPermission none
 *
 * @apiSuccess {String} apiVersion Versão da API
 * @apiSuccess {String} environment Ambiente de execução da API (dev ou prod)
 * @apiSuccess {String} db_online Status da conexão com o banco de dados
 */
statusRoutes.get(
  "/",
  wrapAsync(async (req, res) => {
    let dbOnline = false;
    try {
      const result = await getConnection().raw("select 1+1 as result");
      if (result[0][0].result !== 2) throw new Error();
      dbOnline = true;
    } catch (error) {
      dbOnline = false;
      console.error(error);
    }

    res.json({
      serverName: appConfig.name,
      apiVersion: appConfig.version,
      environment: appConfig.environment,
      commit: appConfig.commit,
      db_online: dbOnline,
    });
  }),
);

module.exports = statusRoutes;
