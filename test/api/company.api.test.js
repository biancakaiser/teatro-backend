const Chance = require("chance");
const moment = require("moment");
const supertest = require("supertest");

const app = require("../../server.js");

const User = require("../../model/user.model.js");

const chance = new Chance();

const testUserData = {
	firstName: chance.first(),
	lastName: chance.last(),
	email: chance.email({ domain: "launchpad.com.br" }),
	password: chance.string({ length: 8 }),
	cpf: chance.cpf().replace(/[.-]/g, ""),
	dob: moment(chance.birthday()).format("YYYY-MM-DD"),
};

module.exports = (apiRequest, expect) => {
	const deepExpectExcluding = (object1, object2, propertiesToExclude) => {
		const obj1 = Object.assign({}, object1);
		const obj2 = Object.assign({}, object2);
		propertiesToExclude.forEach((property) => {
			if (property in obj1) delete obj1[property];
			if (property in obj2) delete obj2[property];
		});
		expect(obj1).to.deep.equal(obj2);
	};

	it("should signup", async () => {
		const signupResponse = await apiRequest("/v1/user/signup", testUserData);
		expect(signupResponse.success).to.equal(true);
	});

	it("should login", async () => {
		const loginResponse = await apiRequest("/v1/user/login", {
			email: testUserData.email,
			password: testUserData.password,
		});
		testUserData.token = loginResponse.token;
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
		visible: 0,
	};

	it("should add a new company", async () => {
		const response = await apiRequest("/v1/company/create", testCompanyData, testUserData.token);
		deepExpectExcluding(response.company, testCompanyData, ["foundationDate", "dissolutionDate", "id"]);
		testCompanyData.id = response.company.id;
	});

	it("should update company info", async () => {
		testCompanyData.name = chance.sentence({ words: 4 });
		const response = await apiRequest("/v1/company/update", testCompanyData, testUserData.token);
		deepExpectExcluding(response.company, testCompanyData, ["foundationDate", "dissolutionDate", "id"]);
	});

	it("should get company info", async () => {
		const response = await apiRequest("/v1/company/getInfo", { id: testCompanyData.id }, testUserData.token);
		deepExpectExcluding(response.company, testCompanyData, ["foundationDate", "dissolutionDate", "id"]);
	});

	const pictureData = {
		UUID: null,
		description: chance.paragraph(),
		origin: chance.sentence(),
	};

	it("should upload a picture", async () => {
		const response = await supertest(app)
			.post(`/v1/company/uploadPicture/${testCompanyData.id}`)
			.set("Cookie", `token=${testUserData.token}`)
			.attach("file", "./test/bed.jpg");

		expect(response.statusCode).to.equal(200);
		pictureData.UUID = response.body.UUID;
	});

	it("should remove a picture", async () => {
		const response = await apiRequest("/v1/company/removePicture", {
			companyId: testCompanyData.id,
			UUID: pictureData.UUID,
		}, testUserData.token);

		expect(response.success).to.be.equal(true);
	});

	it("should set picture info", async () => {
		const response = await apiRequest("/v1/resource/updateInfo", pictureData, testUserData.token);
	});

	it("should get picture info", async () => {
		const response = await apiRequest("/v1/resource/getInfo", {
			UUID: pictureData.UUID,
		}, testUserData.token);
		expect(response.description).to.equal(pictureData.description);
		expect(response.origin).to.equal(pictureData.origin);
	});

	it("should get company record", async () => {
		const response = await apiRequest("/v1/company/getRecord", {
			companyId: testCompanyData.id,
		});
		expect(response.company.name).to.be.equal(testCompanyData.name);
	});

	it("should get all companys", async () => {
		const response = await apiRequest("/v1/company/getAll");
		expect(response.companys.length).to.be.equal(1);
		expect(response.companys[0].name).to.be.equal(testCompanyData.name);
	});

	it("should delete company", async () => {
		const response = await apiRequest("/v1/company/delete", { id: testCompanyData.id }, testUserData.token);
		expect(response.success).to.equal(true);
	});

	it("should logout", async () => {
		await apiRequest("/v1/user/logout", {}, testUserData.token);
	});

	it("should delete test objects", async () => {
		const user = await User.findByEmail(testUserData.email);
		await user.remove();
	});
};
