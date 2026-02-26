const { getConnection } = require("../core/database.js");
const { generateId } = require("../core/utils/general.js");

const database = getConnection();

module.exports = (tableName, schema = { id: null }) => class {
  constructor(constructorObject = null) {
    this.tableName = tableName;
    this.dataObject = Object.assign({}, schema);

    if (constructorObject !== null) {
      this.dataObject = constructorObject;
    }

    // add getters and setters for dataObject values
    Object.keys(this.dataObject).forEach((property) => {
      Object.defineProperty(this, property, {
        get: () => this.dataObject[property],
        set: (value) => {
          this.dataObject[property] = value;
        },
      });
    });
  }

  async setProperty(property, value, ignoreInvalidProperty = true) {
    // use custom setter if one exists
    const customSetter = `set${property.replace(/^\w/, c => c.toUpperCase())}`;
    if (customSetter in this) {
      await this[customSetter](value);
    } else if (this.dataObject.hasOwnProperty(property)) {
      // eslint-disable-line no-prototype-builtins
      this.dataObject[property] = value;
    } else if (!ignoreInvalidProperty) {
      throw Error("ERR_MODEL_INVALID_PROPERTY");
    }
  }

  async setMultipleProperties(data, ignoreInvalidProperty = true) {
    await Promise.all(
      Object.entries(data).map(([property, value]) => this.setProperty(property, value, ignoreInvalidProperty)),
    );
  }

  getData() {
    return this.dataObject;
  }

  async getInfo(propertiesBlacklist = []) {
    const filterKeywords = ["password"].concat(propertiesBlacklist);
    return Object.keys(this.dataObject)
      .filter(
        property => !filterKeywords.find(keyword => property.includes(keyword)),
      )
      .reduce((data, key) => {
        // eslint-disable-next-line no-param-reassign
        data[key] = this.dataObject[key];
        return data;
      }, {});
  }

  async save() {
    // insert if id is null
    if (!this.dataObject.id) {
      this.dataObject.id = Math.ceil(Math.random() * 999999);

      await database(tableName).insert(this.dataObject); // .debug();
      return this;
    }
    // update if id exists
    const numRowsAffected = await database(tableName)
      .where("id", "=", this.dataObject.id)
      .update(this.dataObject);

    if (numRowsAffected === 1) {
      return this;
    }

    throw Error("ERR_UPDATE_NOT_FOUND");
  }

  async remove() {
    const numRowsAffected = await database(tableName)
      .where("id", "=", this.dataObject.id)
      .del();

    if (numRowsAffected === 1) {
      this.dataObject.id = null;
      return this;
    }

    throw Error("ERR_DELETE_NOT_FOUND");
  }

  static async findOne(criteria = {}, likeComparison = false) {
    const comparisonOperator = likeComparison ? "LIKE" : "=";
    const entity = await Object.entries(criteria).reduce(
      (partialQuery, [property, value]) => partialQuery.where(property, comparisonOperator, value),
      database(tableName).first(),
    );
    if (entity) {
      return new this(entity);
    }
    return undefined;
  }

  static async getById(id) {
    const entity = this.findOne({ id });
    if (!entity) {
      throw Error("ERR_NOT_FOUND");
    }
    return entity;
  }

  static async findMultiple(criteria = {}, likeComparison = false) {
    const comparisonOperator = likeComparison ? "LIKE" : "=";
    return (
      await Object.entries(criteria).reduce(
        (partialQuery, [property, value]) => partialQuery.where(property, comparisonOperator, value),
        database(tableName),
      )
    ).map(entity => new this(entity));
  }

  static async findById(id) {
    return this.findOne({ id });
  }

  static async findAll() {
    return this.findMultiple();
  }

  async getCount() {
    return database(this.tableName).count("id");
  }
};
