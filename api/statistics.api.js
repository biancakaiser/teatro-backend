const routes = require("express").Router();
const RateLimit = require("express-rate-limit");

const { wrapAsync } = require("./middleware");

const { TheaterBaseRepo, PlayBaseRepo, CompanyBaseRepo, PersonBaseRepo } = require("../repositories/repositories");

const statisticsAPILimiter = new RateLimit({
	windowMs: 5 * 60 * 1000, // 5 minute window
	max: 200, // requests per windowMs
	delayAfter: 100,
	delayMs: 1000,
});

routes.use(statisticsAPILimiter);

module.exports = routes;

/**
 * @api {post} / Retorna o total de teatros, peças, companhias e pessoas cadastrados
 * @apiName Statistics
 * @apiGroup Statistics
 * @apiSuccess {Objecct} total Total de registros
 */
routes.use("/show", wrapAsync(async (req, res) => {
	const [totalTheater, totalPlay, totalCompany, totalPerson] = await Promise.all([
		TheaterBaseRepo.getCount(),
		PlayBaseRepo.getCount(),
		CompanyBaseRepo.getCount(),
		PersonBaseRepo.getCount(),
	]);

	res.sendResult({
		totalTheater,
		totalPlay,
		totalCompany,
		totalPerson,
	});
}));
