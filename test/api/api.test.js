const chai = require("chai");
const request = require("supertest");

const app = require("../../server.js");
const userAPITest = require("./user.api.test.js");
const theaterAPITest = require("./theater.api.test.js");
const personAPITest = require("./person.api.test.js");
const playAPITest = require("./play.api.test.js");
const companyAPITest = require("./company.api.test.js");
const settingAPITest = require("./setting.api.test.js");
const statisticsAPITest = require("./statistics.api.test.js");

const resourceAPITest = require("./resource.api.test.js");

const { expect } = chai;

const apiRequest = async (path = "", requestData = {}, token = null) => {
	const payload = {
		data: requestData,
	};

	if (token !== null) {
		payload.token = token;
	}

	const response = await request(app).post(path).send(payload);

	if (response.body.error !== undefined) {
		let errorMessage = response.body.error;
		if (response.body.errorDetails) {
			errorMessage += `: ${response.body.errorDetails}`;
		}
		throw Error(errorMessage);
	}

	expect(response.statusCode).to.equal(200);

	expect(response.body.success).to.equal(true);
	return response.body;
};

module.exports = () => {
	let serverReady = null;

	before((done) => {
		if (serverReady === true) {
			done();
		} else {
			serverReady = done;
		}
	});

	app.on("serverReady", () => {
		if (serverReady instanceof Function) {
			serverReady();
		} else {
			serverReady = true;
		}
	});

	describe("UserAPI tests", () => {
		userAPITest(apiRequest, expect);
	});

	describe("TheaterAPI tests", () => {
		theaterAPITest(apiRequest, expect);
	});

	describe("PersonAPI tests", () => {
		personAPITest(apiRequest, expect);
	});

	describe("PlayAPI tests", () => {
		playAPITest(apiRequest, expect);
	});

	describe("CompanyAPI tests", () => {
		companyAPITest(apiRequest, expect);
	});

	describe("SettingAPI tests", () => {
		settingAPITest(apiRequest, expect);
	});

	describe("StatisticsAPI tests", async () => {
		statisticsAPITest(apiRequest, expect);
	});

	// describe("ResourceAPI tests", () => {
	// 	resourceAPITest(apiRequest, expect);
	// });

	after(() => {
		app.close();
	});
};
