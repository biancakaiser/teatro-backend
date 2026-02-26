const { BaseEntity } = require("../core/base_entity");

class Play extends BaseEntity {
	constructor(data) {
		super({
			visible: true,
			name: "",

			originalName: null,
			globalFirstDate: null,
			spFirstDate: null,
			pressReleases: "",
			pressReviews: "",
			bibliografy: "",
			source: "",
			citation: "",

			genreId: null,
			genre: null,

			natinalityId: null,
			nationality: null,

			languageId: null,
			language: null,

			authorId: null,
			author: null,

			referencePlay: "",
			...data,
		});
	}
}

module.exports = {
	Play
};
