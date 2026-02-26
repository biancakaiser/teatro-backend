/* eslint-disable indent */
const { BaseEntity } = require("../core/base_entity");
const { createHash } = require("../core/utils/general");

class Session extends BaseEntity {
	constructor(data) {
		super({
			userId: null,
			user: null,
			token: null,
			...data,
		});
	}

	async beforeInsert() {
		super.beforeInsert();

		if (this.user.id !== this.userId) {
			this.userId = this.user.id;
		}

		if (!this.token) {
			this.token = await createHash(String(this.id));
		}
	}

	afterLoad() {
		super.afterLoad();
		if (this.userId) {
			if (this.user) {
				this.user.id = this.userId;
			} else {
				this.user = { id: this.userId };
			}
		}
	}

	async validateToken() {
		if (!this.token || !this.id) {
			return false;
		}
		const hashedId = await createHash(String(this.id));
		return this.token === hashedId;
	}
}

module.exports = {
	Session,
};
