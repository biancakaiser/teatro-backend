const Chance = require("chance");
const moment = require("moment");
const supertest = require("supertest");

const app = require("../../server.js");
const general = require("../../general.js");
const User = require("../../model/user.model.js");
const Theater = require("../../model/theater.model.js");

const chance = new Chance();

const testUserData = {
	firstName: chance.first(),
	lastName: chance.last(),
	email: chance.email({ domain: "espressolabs.com.br" }),
	password: chance.string({ length: 8 }),
	cpf: chance.cpf().replace(/[.-]/g, ""),
	dob: moment(chance.birthday()).format("YYYY-MM-DD"),
};

module.exports = (apiRequest, expect) => {
	it("should signup", async () => {
		const signupResponse = await apiRequest("/v1/user/signup", testUserData);
		expect(signupResponse.success).to.equal(true);
	});

	it("should login", async () => {
		const loginResponse = await apiRequest("/v1/user/login", {
			email: testUserData.email,
			password: testUserData.password,
		});
		expect(loginResponse.firstName).to.equal(testUserData.firstName);
		expect(loginResponse.lastName).to.equal(testUserData.lastName);
		expect(loginResponse.token).to.a("string");
		testUserData.token = loginResponse.token;
	});

	let testTheater;
	it("should add a new theater", async () => {
		const response = await apiRequest("/v1/theater/create", {
			name: "Teatro de Dionísio",
			foundationAddress: "Acrópole de atenas",
			foundationDate: await general.makeDateTime(),
			neighborhood: "Grécia",
			kind: "Completo, declamações e noivados",
			history: "Nasceu antes de Jesus, morreu depois",
		}, testUserData.token);
		expect(response.newTheater.name).to.be.equal("Teatro de Dionísio");
		testTheater = response.newTheater;
	});

	it("should update theater info", async () => {
		const response = await apiRequest("/v1/theater/update", {
			theaterId: testTheater.id,
			neighborhood: "Bed Stuy",
		}, testUserData.token);
		expect(response.theater.neighborhood).to.be.equal("Bed Stuy");
	});

	let testPerson;
	it("should create a new person", async () => {
		const response = await apiRequest("/v1/person/create", {
			visible: 1,
			civilName: "Karl",
			artistName: "Count0",
			nationalityId: null,
			notes: "the best non-programmer",
		}, testUserData.token);
		expect(response.newPerson.civilName).to.be.equal("Karl");
		testPerson = response.newPerson;
	});

	it("should add a responsible to theater", async () => {
		const response = await apiRequest("/v1/theater/addResponsible", {
			theaterId: testTheater.id,
			personId: testPerson.id,
			firstDate: "01/08/1998",
			name: "Karl",
		}, testUserData.token);
		expect(response.newResponsible.name).to.be.equal("Karl");
	});

	it("should get theater info", async () => {
		const response = await apiRequest("/v1/theater/getInfo", {
			theaterId: testTheater.id,
		});

		expect(response.theaterInfo.name).to.be.equal("Teatro de Dionísio");
	});

	let testUUID;
	it("should upload a picture", async () => {
		const response = await supertest(app)
			.post(`/v1/theater/uploadPicture/${testTheater.id}`)
			.set("Cookie", `token=${testUserData.token}`)
			.attach("file", "./test/bed.jpg");

		expect(response.statusCode).to.equal(200);
		testUUID = response.body.UUID;
	});

	it("should remove a picture", async () => {
		const response = await apiRequest("/v1/theater/removePicture", {
			theaterId: testTheater.id,
			UUID: testUUID,
		}, testUserData.token);

		expect(response.success).to.be.equal(true);
	});

	it("should get all theaters", async () => {
		const response = await apiRequest("/v1/theater/getAll", {});
		expect(response.theaters.length).to.be.equal(1);
		expect(response.theaters[0].name).to.be.equal(testTheater.name);
	});

	it("should get theater record", async () => {
		const response = await apiRequest("/v1/theater/getRecord", {
			theaterId: testTheater.id,
		});

		expect(response.theater.name).to.be.equal(testTheater.name);
	});

	it("should delete person", async () => {
		const response = await apiRequest("/v1/person/delete", {
			personId: testPerson.id,
		}, testUserData.token);

		expect(response.success).to.be.equal(true);
	});

	it("should delete theater", async () => {
		const response = await apiRequest("/v1/theater/delete", {
			theaterId: testTheater.id,
		}, testUserData.token);

		expect(response.success).to.be.equal(true);
	});

	it("should logout", async () => {
		await apiRequest("/v1/user/logout", {}, testUserData.token);
	});

	it("should delete test objects", async () => {
		const user = await User.findByEmail(testUserData.email);
		await user.remove();
	});
};
