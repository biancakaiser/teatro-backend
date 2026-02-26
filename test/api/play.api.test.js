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
		authorId: null,
		visible: 1,
		name: "Sonhos de uma noite de verão",
	};

	it("should add a new play", async () => {
		const response = await apiRequest("/v1/play/create", testPlayData, testUserData.token);
		deepExpectExcluding(response.play, testPlayData, ["globalFirstDate", "spFirstDate", "id"]);
		testPlayData.playId = response.play.id;
	});


	it("should update play info", async () => {
		testPlayData.originalName = chance.sentence({ words: 4 });
		const response = await apiRequest("/v1/play/update", testPlayData, testUserData.token);
		deepExpectExcluding(response.play, testPlayData, ["globalFirstDate", "spFirstDate", "id", "playId"]);
	});

	it("should get play info", async () => {
		const response = await apiRequest("/v1/play/getInfo", { playId: testPlayData.playId }, testUserData.token);
		deepExpectExcluding(response.play, testPlayData, ["globalFirstDate", "spFirstDate", "id", "playId"]);
	});

	it("should get play record", async () => {
		const response = await apiRequest("/v1/play/getRecord", { playId: testPlayData.playId });
		expect(response.play.name).to.be.equal(testPlayData.name);
	});

	it("should get all plays", async () => {
		const response = await apiRequest("/v1/play/getAll");
		expect(response.plays.length).to.be.equal(1);
		expect(response.plays[0].originalName).to.be.equal(testPlayData.originalName);
	});

	it("should delete play", async () => {
		const response = await apiRequest("/v1/play/delete", { id: testPlayData.playId }, testUserData.token);
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
