const Chance = require("chance");
const moment = require("moment");
const supertest = require("supertest");
const request = require("request-promise");

const app = require("../../server.js");
const serverConfig = require("../../server_config.js");
const User = require("../../model/user.model.js");

const chance = new Chance();

let userAdmin;
const testUserData = {
	firstName: chance.first(),
	lastName: chance.last(),
	email: chance.email({ domain: "espressolabs.com.br" }),
	password: chance.string({ length: 8 }),
	cpf: chance.cpf().replace(/[.-]/g, ""),
	dob: moment(chance.birthday()).format("YYYY-MM-DD"),
};

module.exports = (apiRequest, expect) => {
	it("should create a admin user", async () => {
		userAdmin = new User();
		await userAdmin.setBasicInfo(testUserData);
		await userAdmin.setRole("ADMIN");
		await userAdmin.save();

		testUserData.token = await userAdmin.createSession();
		expect(testUserData.token).to.a("string");
	});

	let localFileUUID;
	it("should upload local file", async () => {
		const response = await supertest(app)
			.post("/v1/resource/uploadLocal")
			.set("Cookie", `token=${testUserData.token}`)
			.attach("file", "./package.json");

		expect(response.statusCode).to.equal(200);
		expect(response.body.UUID).to.be.a("string");
		localFileUUID = response.body.UUID;
	});

	let localFileUrl;
	it("should get local file url", async () => {
		const response = await apiRequest("/v1/resource/getUrl", {
			fileName: localFileUUID,
		}, testUserData.token);

		expect(response.fileUrl).to.be.a("string");
		localFileUrl = response.fileUrl;
	});

	it("should fail to download local file without token", async () => {
		try {
			await request.get(localFileUrl);
		} catch (error) {
			expect(error.statusCode).to.equal(401);
		}
	});

	it("should download local file", async () => {
		const downloadedPackage = JSON.parse(await request.get(localFileUrl));
		expect(downloadedPackage.name).to.equal(serverConfig.getPackageName());
	});

	it("should remove local file", async () => {
		const response = await apiRequest("/v1/resource/remove", {
			fileName: localFileUUID,
		}, testUserData.token);
		expect(response.success).to.equal(true);
	});

	it("should fail to get local file url", async () => {
		try {
			const response = await apiRequest("/v1/resource/getUrl", {
				fileName: localFileUUID,
			});
		} catch (error) {
			expect(error.actual).to.equal(401);
		}
	});

	let remoteFileUUID;
	it("should upload remote file", async () => {
		const response = await supertest(app)
			.post("/v1/resource/uploadRemote")
			.set("Cookie", `token=${testUserData.token}`)
			.attach("file", "./package.json");

		expect(response.statusCode).to.equal(200);
		expect(response.body.source).to.equal("REMOTE");
		remoteFileUUID = response.body.UUID;
	});

	let remoteFileUrl;
	it("should get remote file url", async () => {
		const response = await apiRequest("/v1/resource/getUrl", {
			fileName: remoteFileUUID,
		}, testUserData.token);

		expect(response.fileUrl).to.be.a("string");
		remoteFileUrl = response.fileUrl;
	});

	it("should download remote file", async () => {
		const response = JSON.parse(await request.get(remoteFileUrl));
		expect(response.name).to.equal(serverConfig.getPackageName());
	});

	it("should remove remote file", async () => {
		const response = await apiRequest("/v1/resource/remove", {
			fileName: remoteFileUUID,
		}, testUserData.token);
		expect(response.success).to.equal(true);
	});

	it("should fail to get remote file url", async () => {
		try {
			const response = await apiRequest("/v1/resource/getUrl", {
				fileName: remoteFileUUID,
			}, testUserData.token);
		} catch (error) {
			expect(error.actual).to.equal(403);
		}
	});

	it("should delete user", async () => {
		await userAdmin.remove();
	});
};
