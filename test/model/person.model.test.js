const chai = require("chai");
const Chance = require("chance");

const general = require("../../general.js");
const Person = require("../../model/person.model.js");

const { expect } = chai;
const chance = new Chance();

module.exports = () => {
	let testPerson;
	it("should create a new person", async () => {
		testPerson = new Person();
		const basicInfo = {
			visible: 1,
			civilName: "Karl",
			artistName: "Count0",
			birthPlace: "São tomé",
			nationalityId: null,
			notes: "the best non-programmer",
			birthPlace: "São Paulo",
		};
		await testPerson.setBasicInfo(basicInfo);
		await testPerson.save();
	});

	it("should get person info", async () => {
		const info = await testPerson.getInfo();
		expect(info.artistName).to.be.equal("Count0");
	});

	it("should exclude test objects", async () => {
		await testPerson.remove();
	});
};
