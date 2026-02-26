const uuidv4 = require("uuid/v4");
const { BaseEntity } = require("../core/base_entity");
const { getRemoteUrl } = require("../upload");

const SourceEnum = Object.freeze({ REMOTE: "REMOTE", LOCAL: "LOCAL" });

class Resource extends BaseEntity {
	constructor(data) {
		super({
			fileName: "",
			source: true,
			UUID: null, // Sempre string
			size: 0,
			contentType: "",
			private: false,
			description: "",
			origin: "",
			sponsor: false,
			...data,
		});
	}

	async beforeInsert() {
		if (!this.id) {
			this.id = Math.ceil(Math.random() * 999999);
		}

		if (!this.UUID) {
			this.UUID = await uuidv4();
		}
	}

	get URL() {
		return getRemoteUrl(this.fileName);
	}
}

module.exports = {
	SourceEnum,
	Resource,
};
