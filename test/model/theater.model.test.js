const chai = require("chai");
const Chance = require("chance");

const general = require("../../general.js");
const Theater = require("../../model/theater.model.js");
const User = require("../../model/user.model.js");

const { expect } = chai;
const chance = new Chance();

module.exports = () => {
	let testTheater;
	it("should create a new theater", async () => {
		testTheater = new Theater();
		const basicInfo = {
			name: "Teatro de Dionísio",
			foundationAddress: "Acrópole de atenas",
			foundationDate: await general.makeDateTime(),
			neighborhood: "Grécia",
		};
		await testTheater.setBasicInfo(basicInfo);
		await testTheater.save();
	});

	it("should get theater info", async () => {
		const info = await testTheater.getInfo();
		expect(info.name).to.be.equal("Teatro de Dionísio");
	});

	it("should find theater by address", async () => {
		const foundTheaters = await Theater.findByAddress("atenas");
		expect(foundTheaters[0].neighborhood).to.be.equal("Grécia");
	});

	it("should delete test objects", async () => {
		await testTheater.remove();
	});
};
