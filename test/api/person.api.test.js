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

	let testPerson;
	it("should create a new person", async () => {
		const response = await apiRequest("/v1/person/create", {
			visible: 1,
			civilName: "Karl",
			artistName: "Count0",
			nationalityId: null,
			notes: "the best non-programmer",
			birthPlace: "São tomé das letras",
			gender: "",
			race: "",
			birthPlace: "São tomé",
			expertise: "Não é node",
		}, testUserData.token);
		expect(response.newPerson.civilName).to.be.equal("Karl");
		testPerson = response.newPerson;
	});

	const testCompanyData = {
		name: chance.sentence({ words: 3 }),
		otherNames: chance.sentence({ words: 5 }),
		nationalityId: null,
		foundationDate: chance.date(),
		foundationPlace: chance.sentence({ words: 3 }),
		dissolutionDate: chance.date(),
		path: chance.paragraph(),
		notes: chance.paragraph(),
		bibliography: chance.paragraph(),
		citation: chance.paragraph(),
	};

	it("should add a new company", async () => {
		const response = await apiRequest("/v1/company/create", testCompanyData, testUserData.token);
		testCompanyData.id = response.company.id;
	});

	it("should get person info", async () => {
		const response = await apiRequest("/v1/person/getInfo", {
			personId: testPerson.id,
		});
		expect(response.person.civilName).to.be.equal("Karl");
	});

	it("should update person info", async () => {
		const response = await apiRequest("/v1/person/update", {
			personId: testPerson.id,
			race: "PARDA",
		}, testUserData.token);
		expect(response.person.race).to.be.equal("PARDA");
	});

	let testUUID;
	it("should upload a picture", async () => {
		const response = await supertest(app)
			.post(`/v1/person/uploadPicture/${testPerson.id}`)
			.set("Cookie", `token=${testUserData.token}`)
			.attach("file", "./test/bed.jpg");

		expect(response.statusCode).to.equal(200);
		testUUID = response.body.UUID;
	});

	it("should remove a picture", async () => {
		const response = await apiRequest("/v1/person/removePicture", {
			personId: testPerson.id,
			UUID: testUUID,
		}, testUserData.token);

		expect(response.success).to.be.equal(true);
	});

	let roleId;
	it("should create a new role", async () => {
		const response = await apiRequest("/v1/person/addRole", {
			name: "Diretor",
		}, testUserData.token);
		expect(response.success).to.be.equal(true);
		roleId = response.roleId;
	});

	it("should add a job to person", async () => {
		const response = await apiRequest("/v1/person/addJob", {
			firstDate: "1875-04-11",
			lastDate: "1896-07-23",
			personId: testPerson.id,
			companyId: testCompanyData.id,
			roleId,
		}, testUserData.token);
		expect(response.success).to.be.equal(true);
	});

	it("should get records from person", async () => {
		const response = await apiRequest("/v1/person/getRecord", {
			personId: testPerson.id,
		});
		expect(response.person.name).to.be.equal(testPerson.name);
	});

	it("should get all persons", async () => {
		const response = await apiRequest("/v1/person/getAll");
		expect(response.persons.length).to.be.equal(1);
		expect(response.persons[0].civilName).to.be.equal(testPerson.civilName);
	});

	it("should delete person", async () => {
		const response = await apiRequest("/v1/person/delete", {
			personId: testPerson.id,
		}, testUserData.token);

		expect(response.success).to.be.equal(true);
	});

	it("should delete company", async () => {
		const response = await apiRequest("/v1/company/delete", { id: testCompanyData.id }, testUserData.token);
		expect(response.success).to.equal(true);
	});

	it("should delete test objects", async () => {
		const user = await User.findByEmail(testUserData.email);
		await user.remove();
	});
};
