/* eslint-disable linebreak-style */
/* eslint-disable indent */
const { flatMap } = require("./utils/arrays"); // habilita utilidades de array
const { filterProperties } = require("./utils/objects");

const { database } = require("../app_config");
const { getConnection } = require("../core/database");
const BaseEntity = require("./base_entity");
const { Column, Model } = require("./base_model");

class BaseRepository {
  constructor(model, connection) {
    if (!(model instanceof Model)) {
      throw new Error("Modelo de repositório inválido");
    }

    this.model = model;
    this.connection = connection || getConnection(); // conexão usada para fazer requisições
  }

  get tableName() {
    return this.model.tableName;
  }

  get tableColumns() {
    return this.model.columns.map(([name]) => name);
  }

  /**
   * @param {Partial<BaseEntity>} entities
   * @returns {Promise<BaseEntity[]>} */
  async insert(...entities) {
    // mapear as entidade para entidades válidas
    const mappedEntities = await Promise.all(
      entities.map(async (entity) => {
        const maped = this.model.toEntity(entity);
        await maped.beforeInsert();

        return maped;
      }),
    );

    // inserir entidades em batchs
    const validColumns = this.tableColumns;
    const inserted = await this.connection.transaction(transaction => this.connection
      .batchInsert(
        this.tableName,
        mappedEntities.map(item => filterProperties(item, validColumns)),
        100,
      )
      .transacting(transaction));

    return mappedEntities;
  }

  async remove(entity) {
    const numRowsAffected = await this.connection
      .table(this.tableName)
      .where("id", "=", entity.id)
      .del();

    if (numRowsAffected < 1) {
      throw Error("ERR_DELETE_NOT_FOUND");
    }
  }

  /** @returns {Promise<BaseEntity>} */
  async update(entity, fields) {
    const query = this.connection
      .table(this.tableName)
      .where("id", "=", entity.id);

    const mappedEntity = this.model.toEntity(entity);
    await mappedEntity.beforeUpdate();

    if (!fields) {
      query.update({
        ...mappedEntity,
        id: undefined,
      });
    } else {
      query.update(
        fields.reduce((updatedFields, field) => {
          if (!["id", "creationDate"].includes(field)) {
            // eslint-disable-next-line no-param-reassign
            updatedFields[field] = mappedEntity[field];
          }
          return updatedFields;
        }, {}),
      );
    }

    const numRowsAffected = await query;

    if (numRowsAffected < 1) {
      throw Error("ERR_UPDATE_NOT_FOUND");
    }

    return mappedEntity;
  }

  /** @returns {Promise<BaseEntity[]>} * */
  async find(criteria = {}, select) {
    const query = this.connection.table(this.tableName).select(select || "*");
    Object.entries(criteria).reduce(
      (qb, [prop, value]) => qb.where(prop, "=", value),
      query,
    );

    const results = await query;

    return results.map((data) => {
      const entity = this.model.toEntity(data);
      entity.afterLoad();

      return entity;
    });
  }

  /** @returns {Promise<BaseEntity>} * */
  async findOne(criteria = {}, select) {
    const query = this.connection.table(this.tableName).select(select || "*");
    Object.entries(criteria).reduce(
      (qb, [prop, value]) => qb.where(prop, "=", value),
      query,
    );

    const results = await query.limit(1);

    if (results.length !== 1) {
      return null;
    }
    const entity = this.model.toEntity(results[0]);
    entity.afterLoad();

    return entity;
  }

  /** @returns {Promise<BaseEntity>} * */
  async findById(id) {
    return this.findOne({ id });
  }

  /**
   * @brief Conta a quantidade de entidades na tabela
   * @returns {Promise<number>}
   * */
  async getCount() {
    return Object.values(
      (await this.connection.table(this.tableName).count("*"))[0],
    )[0];
  }

  async queryBuilder(callback) {
    const query = this.connection(`${this.tableName}`);
    callback(query);

    return query;
  }
}

module.exports = BaseRepository;
