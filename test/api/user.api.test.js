const Chance = require("chance");
const moment = require("moment");

const User = require("../../model/user.model.js");

const chance = new Chance();

const testUserData = {
	firstName: chance.first(),
	lastName: chance.last(),
	email: chance.email({ domain: "espressolabs.com.br" }),
	password: chance.string({ length: 8 }),
	cpf: chance.cpf().replace(/[.-]/g, ""),
	dob: moment(chance.birthday()).format("YYYY-MM-DD"),
	role: "ADMIN",
};

const testUserData2 = {
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

	it("should signup user2", async () => {
		const signupResponse = await apiRequest("/v1/user/signup", testUserData2);
		expect(signupResponse.success).to.equal(true);
	});

	it("should login user", async () => {
		const loginResponse = await apiRequest("/v1/user/login", {
			email: testUserData.email,
			password: testUserData.password,
		});
		expect(loginResponse.firstName).to.equal(testUserData.firstName);
		expect(loginResponse.lastName).to.equal(testUserData.lastName);
		expect(loginResponse.token).to.a("string");
		testUserData.token = loginResponse.token;
	});

	it("should login user2", async () => {
		const loginResponse = await apiRequest("/v1/user/login", {
			email: testUserData2.email,
			password: testUserData2.password,
		});
		expect(loginResponse.firstName).to.equal(testUserData2.firstName);
		expect(loginResponse.lastName).to.equal(testUserData2.lastName);
		expect(loginResponse.token).to.a("string");
		testUserData2.token = loginResponse.token;
	});

	it("should get info of user", async () => {
		const infoResponse = await apiRequest("/v1/user/getInfo", {}, testUserData.token);
		expect(infoResponse.firstName).to.equal(testUserData.firstName);
		expect(infoResponse.lastName).to.equal(testUserData.lastName);
	});

	let user2Id;
	it("should get info of user2", async () => {
		const infoResponse = await apiRequest("/v1/user/getInfo", {}, testUserData2.token);
		expect(infoResponse.firstName).to.equal(testUserData2.firstName);
		expect(infoResponse.lastName).to.equal(testUserData2.lastName);
		user2Id = infoResponse.id;
	});

	it("should update info", async () => {
		const newLastName = "Sobrenome2";
		const response = await apiRequest("/v1/user/updateInfo", {
			lastName: newLastName,
		}, testUserData.token);
		expect(response.lastName).to.equal(newLastName);
		testUserData.lastName = newLastName;
	});

	it("should find all users", async () => {
		// make user an admin
		const user = await User.findByEmail(testUserData.email);
		await user.setRole("ADMIN");
		await user.save();
		// list users
		const response = await apiRequest("/v1/user/findAll", {}, testUserData.token);
		expect(response.users.length).to.equal(3);
	});

	it("should change password", async () => {
		const newPassword = "123456";
		await apiRequest("/v1/user/changePassword", {
			newPassword,
			currentPassword: testUserData.password,
		}, testUserData.token);
		testUserData.password = newPassword;
	});

	it("user should change password of user2", async () => {
		const response = await apiRequest("/v1/user/changePassword", {
			userId: user2Id,
			newPassword: "test",
		}, testUserData.token);
		expect(response.success).to.be.equal(true);
	});

	it("user should exclude user2", async () => {
		const response = await apiRequest("/v1/user/exclude", {
			userId: user2Id,
		}, testUserData.token);
		expect(response.success).to.be.equal(true);
	});

	it("should logout", async () => {
		await apiRequest("/v1/user/logout", {}, testUserData.token);
	});

	it("should delete the user", async () => {
		const user = await User.findByEmail(testUserData.email);
		await user.remove();
	});
};
