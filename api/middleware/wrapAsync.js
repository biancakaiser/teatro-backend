module.exports = asyncFunction => (req, res, next) => {
	asyncFunction(req, res, next)
		.catch(next);
};
