const knex = require("knex");
const { flatMap } = require("./utils/arrays");
const { defaults } = require("request-promise");
const { getConnection } = require("./database");
const { options } = require("joi/lib/types/alternatives");
const { entityClass } = require("../repositories/session.repository");

class Column {
  constructor(type, options, defaultValue, nullable) {
    this.type = type;
    this.options = options || {};
    this.defaultValue = defaultValue;
    this.nullable = nullable;
  }

  apply(qb, table, columnName) {
    if (this.type in table) {
      let columnInfo = table[this.type].call(table, columnName, this.options);
      if (this.nullable) {
        columnInfo.nullable(); //colunas são nullableTrue por padrão
      } else {
        columnInfo.notNullable();
      }
      if (this.defaultValue) {
        if (typeof this.defaultValue === "function") {
          columnInfo.defaultTo(this.defaultValue(qb, table, columnName));
        } else {
          columnInfo.defaultTo(this.defaultValue);
        }
      }
    } else {
      throw new Error(`Invalid column type: ${this.type}`);
    }
  }

  alter(qb, table, columnName) {
    if (this.type in table) {
      let columnInfo = table[this.type].call(table, columnName, this.options);
      if (this.nullable) {
        columnInfo.nullable();
      } else {
        columnInfo.notNullable();
      }
      if (this.defaultValue) {
        if (typeof this.defaultValue === "function") {
          columnInfo.defaultTo(this.defaultValue(qb, table, columnName));
        } else {
          columnInfo.defaultTo(this.defaultValue);
        }
      }
      columnInfo.alter();
    } else {
      throw new Error(`Invalid column type: ${this.type}`);
    }
  }

  static drop(table, ...columnName) {
    table.dropColumns(columnName);
  }
}

/** @brief Classe abstrata para Propriedades dropáveis de colunas **/
class ColumnsDroppable {
  toIndexName(idxName) {
    return `${idxName}_idx`;
  }

  constructor(columns, options) {
    this.columns = columns;
    this.options = options || {};
  }

  drop(_tabel, _idxName) { }
}

/** @brief Cria um index na tabela **/
class Index extends ColumnsDroppable {
  apply(table, idxName) {
    table.index(this.columns, this.toIndexName(idxName), this.options);
  }

  drop(table, idxName) {
    table.dropIndex(this.columns, this.toIndexName(idxName));
  }
}

/** @brief Cria um index único na tabela **/
class Unique extends ColumnsDroppable {
  toIndexName(idxName) {
    return `${idxName}_pkey`;
  }
  apply(table, idxName) {
    table.unique(this.columns, this.toIndexName(idxName));
  }

  drop(table, idxName) {
    table.dropUnique(this.columns, this.toIndexName(idxName));
  }
}
/** @brief Cria uma chave primária na tabela **/
class Primary extends ColumnsDroppable {
  //NOTE: sql tem problemas em nomear chaves primárias
  toIndexName(idxName) {
    return `${idxName}_pkey`;
  }
  apply(table, idxName) {
    table.primary(this.columns, this.toIndexName(idxName));
  }
  drop(table, idxName) {
    table.dropPrimary(this.toIndexName(idxName));
  }
}

/** @brief Cria uma foreignKey na tabela **/
class Foreign extends ColumnsDroppable {
  constructor(columns, references, options) {
    super(columns, options);
    options.onDelete = options.onDelete || "NO ACTION";
    options.onUpdate = options.onUpdate || "NO ACTION";
    this.references = references;
  }

  toIndexName(idxName) {
    return `${idxName}_fk`;
  }

  apply(table, idxName) {
    table
      .foreign(this.columns, this.toIndexName(idxName)) //
      .references(this.references)
      .onDelete(this.options.onDelete) //
      .onUpdate(this.options.onUpdate);
  }

  drop(table, idxName) {
    //NOTE: dropForeign e dropIndex devem ser usadas em conjunto no MySQL
    //ja que a criação de uma chaves estrangeira implica na criação de um index

    table.dropForeign(this.columns, this.toIndexName(idxName));
    table.dropIndex(this.columns, this.toIndexName(idxName));
  }
}

function defineColumn(type, options, defaultValue, nullable) {
  return new Column(type, options || {}, defaultValue, nullable);
}


function defineIdColumn(nullable) {
  return new Column("integer", 11, undefined, nullable);
}

function defineIndex(columns, options) {
  return new Index(columns, options);
}

function defineUnique(columns, options) {
  return new Unique(columns, options);
}

function definePrimary(columns, options) {
  return new Primary(columns, options);
}

function defineForeign(columns, references, options) {
  return new Foreign(columns, references, options || {});
}

class Model {
  constructor(entityClass, ...fields) {
    this.entityClass = entityClass;
    this.fields = fields;
  }

  get columns() {
    return flatMap(this.fields, (item) => Object.entries(item)).filter(([_, value]) => value instanceof Column);
  }

  get indexes() {
    return flatMap(this.fields, (item) => Object.entries(item)).filter(([_, value]) => value instanceof ColumnsDroppable);
  }

  get tableName() {
    return new this.entityClass().constructor.name;
  }

  toEntity(data) {
    return new this.entityClass(data);
  }

  freeze() {
    return Object.freeze(this);
  }
}

/** @brief define a configuraçao de uma campo em uma entidaed
 * @note O modelo deve ser definido como: [tipo de campo, opções do tipo]
 * O tipo deve ser nomeados conforme as
 **/
const BaseEntityModel = Object.freeze([
  {
    primaryKey: definePrimary(["id"]), //chave primária em id
    id: defineIdColumn(false), //indetificador
  },
  {
    creationDate: defineColumn(
      "timestamp",
      { precision: 6 },
      (qb) => qb.fn.now(),
      false,
    ), //timestamp de criação
    updatedDate: defineColumn(
      "timestamp",
      { precision: 6 },
      (qb) => qb.fn.now(),
      false,
    ), //timestamp de atualização
  },
]);

module.exports = {
  ColumnsDroppable,
  Column,
  Index,
  Unique,
  Primary,
  Foreign,
  Model,
  defineColumn,
  defineIdColumn,
  defineIndex,
  defineUnique,
  definePrimary,
  defineForeign,
  BaseEntityModel,
};
