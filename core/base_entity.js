const { generateId, makeDateTime } = require("./utils/general");

/**
 * @brief Definição de um entidade compatível com o banco de dados
 * */
class DatabaseEntity {
  constructor({ ...data }) {
    Object.assign(this, data);
  }

  beforeInsert() { }

  beforeUpdate() { }

  afterLoad() { }

  afterDelete() { }
}

/**
 * @brief Definição de um entidade com os campos padrão
 * */
class BaseEntity extends DatabaseEntity {
  constructor(data) {
    super({
      id: null, // indetificador
      creationDate: undefined, // timestamp de criação
      // updatedDate: new Date(), // timestamp de atualização
      ...data,
    });
  }

  get tableName() {
    return this.constructor.name;
  }

  async beforeInsert() { }

  async beforeUpdate() {
    // this.updatedDate = makeDateTime();
  }

  afterLoad() { }

  sanitized() {
    return this;
  }
}

module.exports = {
  DatabaseEntity,
  BaseEntity,
};
