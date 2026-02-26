const Chance = require("chance");
const moment = require("moment");

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

	const testPlayData = {
		originalName: chance.sentence({ words: 3 }),
		globalFirstDate: chance.date(),
		spFirstDate: chance.date(),
		pressReleases: chance.paragraph(),
		pressReviews: chance.paragraph(),
		bibliography: chance.paragraph(),
		source: chance.paragraph(),
		citation: chance.paragraph(),
		nationalityId: null,
		languageId: null,
		genreId: null,
		visible: 0,
		name: "A megera domada",
	};

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
		visible: 1,
	};

	const testSettingData = {
		playId: null,
		companyId: null,
	};

	const testGenreData = {
		listName: "Genre",
		name: chance.sentence({ words: 2 }),
	};

	const testRoleData = {
		listName: "Role",
		name: chance.word(),
	};

	const testPersonData = {
		visible: 1,
		civilName: chance.name(),
		artistName: chance.name(),
		nationalityId: null,
		notes: chance.paragraph(),
	};

	const testTheaterData = {
		name: chance.sentence({ words: 2 }),
		foundationAddress: chance.sentence({ words: 3 }),
		foundationDate: chance.date(),
		neighborhood: chance.sentence({ words: 2 }),
	};

	const testPresentationData = {
		settingId: null,
		theaterId: null,
		date: chance.date(),
		sessionsNumber: chance.natural({ min: 1, max: 200 }),
	};

	const testConceptionData = {
		settingId: null,
		personId: null,
		roleId: null,
	};

	it("should add a new play", async () => {
		const response = await apiRequest("/v1/play/create", testPlayData, testUserData.token);
		deepExpectExcluding(response.play, testPlayData, ["globalFirstDate", "spFirstDate", "id", "authorId"]);
		testPlayData.id = response.play.id;
	});

	it("should add a new company", async () => {
		const response = await apiRequest("/v1/company/create", testCompanyData, testUserData.token);
		deepExpectExcluding(response.company, testCompanyData, ["foundationDate", "dissolutionDate", "id"]);
		testCompanyData.id = response.company.id;
	});

	it("should add a new genre", async () => {
		const response = await apiRequest("/v1/lists/add", testGenreData, testUserData.token);
		expect(response.name).to.equal(testGenreData.name);
		testGenreData.id = response.id;
	});

	it("should add a new role", async () => {
		const response = await apiRequest("/v1/lists/add", testRoleData, testUserData.token);
		expect(response.name).to.equal(testRoleData.name);
		testRoleData.id = response.id;
	});

	it("should add a new person", async () => {
		testPersonData.roleId = testRoleData.id;
		const response = await apiRequest("/v1/person/create", testPersonData, testUserData.token);
		testPersonData.id = response.newPerson.id;
	});

	it("should search for the person", async () => {
		const response = await apiRequest("/v1/search/people", {
			personName: testPersonData.artistName,
		}, testUserData.token);

		expect(response.people.length).to.equal(1);
	});

	it("should add a new theater", async () => {
		const response = await apiRequest("/v1/theater/create", testTheaterData, testUserData.token);
		testTheaterData.id = response.newTheater.id;
	});

	it("should add a new setting", async () => {
		testSettingData.playId = testPlayData.id;
		testSettingData.companyId = testCompanyData.id;
		testSettingData.genreId = testGenreData.id;

		const response = await apiRequest("/v1/setting/create", testSettingData, testUserData.token);

		testSettingData.id = response.setting.id;
	});

	it("should add a new presentation", async () => {
		testPresentationData.settingId = testSettingData.id;
		testPresentationData.theaterId = testTheaterData.id;

		const response = await apiRequest("/v1/setting/addPresentation", testPresentationData, testUserData.token);

		testPresentationData.id = response.presentation.id;
	});


	it("should search for the presentation", async () => {
		const response = await apiRequest("/v1/search/presentations", {
			playName: testPlayData.originalName,
			companyId: testCompanyData.id,
			theaterId: testTheaterData.id,
			settingGenreId: testSettingData.genreId,
			dateStart: testPresentationData.date,
			dateEnd: testPresentationData.date,
			page: 1,
		}, testUserData.token);

		expect(response.presentations.length).to.equal(1);
	});

	it("should remove the presentation", async () => {
		const response = await apiRequest("/v1/setting/removePresentation", {
			settingId: testSettingData.id,
			presentationId: testPresentationData.id,
		}, testUserData.token);
		expect(response.success).to.equal(true);
	});

	it("should get setting record", async () => {
		const response = await apiRequest("/v1/setting/getRecord", {
			settingId: testSettingData.id,
		}, testUserData.token);
		expect(response.success).to.equal(true);
	});

	it("should delete the setting", async () => {
		const response = await apiRequest("/v1/setting/delete", { id: testSettingData.id }, testUserData.token);
		expect(response.success).to.equal(true);
	});

	it("should delete the theater", async () => {
		const response = await apiRequest("/v1/theater/delete", { theaterId: testTheaterData.id }, testUserData.token);
		expect(response.success).to.equal(true);
	});

	it("should delete the person", async () => {
		const response = await apiRequest("/v1/person/delete", { personId: testPersonData.id }, testUserData.token);
		expect(response.success).to.equal(true);
	});

	it("should delete the role", async () => {
		const response = await apiRequest("/v1/lists/delete", { listName: "Role", id: testRoleData.id }, testUserData.token);
		expect(response.success).to.equal(true);
	});

	it("should delete the genre", async () => {
		const response = await apiRequest("/v1/lists/delete", { listName: "Genre", id: testGenreData.id }, testUserData.token);
		expect(response.success).to.equal(true);
	});

	it("should delete company", async () => {
		const response = await apiRequest("/v1/company/delete", { id: testCompanyData.id }, testUserData.token);
		expect(response.success).to.equal(true);
	});

	it("should delete play", async () => {
		const response = await apiRequest("/v1/play/delete", { id: testPlayData.id }, testUserData.token);
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
