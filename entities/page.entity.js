const { BaseEntity } = require("../core/base_entity");

class Page extends BaseEntity {
	constructor(data) {
		super({
			title: "",
			description: undefined,
			content: "",
			...data,
		});
	}

	get noContent() {
		return {
			id: this.id,
			title: this.title,
			description: this.description,
		};
	}
}

module.exports = {
	Page,
};
