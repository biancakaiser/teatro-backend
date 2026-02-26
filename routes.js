const routes = require("express").Router();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const appConfig = require("./app_config");

routes.use(bodyParser.json());// enables parsing json
routes.use(cookieParser());// parses the cookies

// CORS handling middleware
routes.use((request, response, next) => {
	const origin = request.get("origin");
	const method = request.method.toLowerCase();

	if (method === "get") { // allow all get requests
		next();
	} else if (appConfig.server.checkOrigin(origin)) { // verify request origin before continuing
		response.header("Access-Control-Allow-Origin", origin);
		response.header("Access-Control-Allow-Credentials", "true");

		if (method === "options") { // if CORS preflight request, respond with allowed methods, headers and max-age
			response.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
			response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			response.header("Access-Control-Max-Age", "86400"); // preflight response valid for a day
		}

		next();
	} else {
		response.status(403).end(); // invalid origin
	}
});

// Send formatted response middleware
routes.use((request, response, next) => {
	response.sendResult = (data = {}) => {
		const responseData = data;
		responseData.success = true;
		return response.send(responseData);
	};


	request.getIPAddress = () => (
		request.headers["x-forwarded-for"]
		|| request.connection.remoteAddress
		|| request.socket.remoteAddress
		|| request.connection.socket.remoteAddress
	);

	request.getUserAgent = () => request.headers["user-agent"];

	next();
});

// API routes
routes.use("/", require("./api/status.api"));
routes.use("/page", require("./api/page.api"));
routes.use("/user", require("./api/user.api"));
routes.use("/theater", require("./api/theater.api"));
routes.use("/person", require("./api/person.api"));
routes.use("/resource", require("./api/resource.api"));
routes.use("/play", require("./api/play.api"));
routes.use("/company", require("./api/company.api"));
routes.use("/setting", require("./api/setting.api"));
routes.use("/lists", require("./api/lists.api"));
routes.use("/search", require("./api/search.api"));
routes.use("/statistics", require("./api/statistics.api"));


// Error handler
routes.use((error, req, res, next) => {
	console.error("[Error]:", req.originalUrl, error);
	if (error.message.startsWith("ERR_API")) {
		res.status(403).send({ error: error.message });
	} else if (error.code === "ERR_DUP_ENTRY") {
		res.status(409).send({ error: "ERR_API_DUPLICATE" });
	} else if (error.name === "ValidationError") {
		res.status(400).send({
			errorDetails: error.details[0].message,
			error: "ERR_BAD_REQUEST",
		});
	} else if (error.status === 404 || error.message === "ERR_NOT_FOUND") {
		res.status(404).send({ error: "ERR_NOT_FOUND" });
	} else if (error.status === 403 || error.message === "FORBIDDEN") {
		res.status(403).send({ error: "FORBIDDEN" });
	} else if (error.status === 401 || error.message === "UNAUTHORIZED") {
		res.status(401).send({ error: "UNAUTHORIZED" });
	} else {
		res.status(500).send({ error: "ERR_SERVER" });
		console.error(error);
	}
});

module.exports = routes;
