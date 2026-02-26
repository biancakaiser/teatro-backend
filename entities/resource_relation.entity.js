const { type } = require("express/lib/response");
const { BaseEntity } = require("../core/base_entity");
const { Person } = require("../entities/person.entity");
const { Company } = require("../entities/company.entity");
const { Play } = require("../entities/play.entity");
const { Theater } = require("../entities/theater.entity");


const ResourceType = Object.freeze({
	COMPANY: "COMPANY",
	PERSON: "PERSON",
	THEATER: "THEATER",
	PLAY: "PLAY",
});

class ResourceRelation extends BaseEntity {
	constructor(data) {
		super({
			UUID: null,
			_type: null, // virtual
			_owner: null, // virtual
			companyId: null,
			personId: null,
			theaterId: null,
			playId: null,
			...data,
		});
	}

	async beforeInsert() {
		if (!this.id) {
			this.id = Math.ceil(Math.random() * 999999);
		}

		if (!this.UUID) {
			throw new Error("Missing UUID");
		}
	}

	set type(type) {
		this._type = type;
	}

	set owner(entity) {
		if (entity instanceof Company) {
			this.companyId = entity.id;
			this._type = ResourceType.COMPANY;
		} else if (entity instanceof Person) {
			this.personId = entity.id;
			this._type = ResourceType.PERSON;
		} else if (entity instanceof Theater) {
			this.theaterId = entity.id;
			this._type = ResourceType.THEATER;
		} else if (entity instanceof Play) {
			this.theaterId = entity.id;
			this._type = ResourceType.PLAY;
		} else if (!this._type) {
			// NOTE: deve ter um tipo ja definido antes de alterar os dados para uma entidade sem classe
			throw new Error("Assinatura inválida de recurso");
		}

		this._owner = entity;
	}

	/** @brief retorna os dados da entidade dona do recurso */
	get owner() {
		if (!this._owner) {
			switch (this._type) {
				case ResourceType.COMPANY: this._owner = new Company({ id: this.companyId }); break;
				case ResourceType.PERSON: this._owner = new Person({ id: this.personId }); break;
				case ResourceType.THEATER: this._owner = new Theater({ id: this.theaterId }); break;
				case ResourceType.PLAY: this._owner = new Play({ id: this.playId }); break;
			}
		}

		return this._owner;
	}
}

module.exports = {
	ResourceRelation,
	ResourceType,
};
