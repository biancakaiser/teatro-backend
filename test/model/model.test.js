const userModelTest = require("./user.model.test.js");
const theaterModelTest = require("./theater.model.test.js");
const personModelTest = require("./person.model.test.js");

module.exports = () => {
	describe("User tests", userModelTest);

	describe("Theater tests", theaterModelTest);

	describe("Person tests", personModelTest);
};
