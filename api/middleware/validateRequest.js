const Joi = require("joi");

module.exports = requestSchema => (req, res, next) => {
	res.locals.payloadSchema = requestSchema;
	return Joi.validate(req.body.data, requestSchema)
		.then((validatedPayload) => {
			res.locals.payload = validatedPayload;
			next();
		})
		.catch(next);
};
