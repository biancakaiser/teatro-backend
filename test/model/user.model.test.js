const chai = require("chai");
const Chance = require("chance");

const general = require("../../general.js");
const User = require("../../model/user.model.js");

const { expect } = chai;
const chance = new Chance();

module.exports = () => {
	const randomNumber = Math.floor(Math.random() * 99999);

	const USER_EMAIL = chance.email({ domain: "espressolabs.com.br" });
	const USER_PASSWORD = chance.string({ length: 8 });

	let testUser = null;
	it("should save a new user", async () => {
		testUser = new User();

		await testUser.setBasicInfo({
			firstName: chance.first(),
			lastName: chance.last(),
			email: USER_EMAIL,
			role: "ADMIN",
			password: USER_PASSWORD,
			cpf: chance.cpf().replace(/[.-]/g, ""),
			dob: new Date("1990-01-02"),
		});

		await testUser.save();
	});

	it("should validate right password", async () => {
		const user = await User.findByEmail(USER_EMAIL);
		expect(await user.validatePassword(USER_PASSWORD)).to.equal(true);
	});

	it("should reject wrong password", async () => {
		const user = await User.findByEmail(USER_EMAIL);
		expect(await user.validatePassword("wrogn")).to.equal(false);
	});

	it("should find user by email", async () => {
		const user = await User.findByEmail(USER_EMAIL);
		expect(user.getData()).to.deep.equal(testUser.getData());
	});

	it("should find user by id", async () => {
		const user = await User.findById(testUser.id);
		expect(user.getData()).to.deep.equal(testUser.getData());
	});

	let testToken;
	it("should create a session", async () => {
		testToken = await testUser.createSession();
		testUser.setCurrentToken(testToken);
		await testUser.save();
	});

	it("should find user by token", async () => {
		const user = await User.findByToken(testToken);
		expect(user.getData()).to.deep.equal(testUser.getData());
	});

	it("should revoke the token", async () => {
		await testUser.revokeCurrentToken();
	});

	it("should delete test user", async () => {
		await testUser.remove();
	});
};
