const fs = require("fs");
const knex = require("knex");
const { database: databaseConfig } = require("../app_config.js");
const { Column, ColumnsDroppable, Primary, Index, Model } = require("./base_model.js");

/* @brief Map de conexões com o banco de dados */
const connections = new Map();

/**
 * @brief Cria um nova conexão
 * */
function createConnection() {
  return knex({
    client: "mysql",
    connection: {
      socketPath: "",
      port: 3307,
      ...databaseConfig,
    },
  });
}

/**
 * @brief Cria ou retorna uma conexão específica
 * */
function getConnection(connectionName) {
  const conName = connectionName || "default";

  if (!connections.has(conName)) {
    const newConnection = createConnection();
    connections.set(conName, newConnection);
    console.info("Nova conexão estabelecida:", conName);
  }

  return connections.get(conName);
}

async function listTables(connection) {
  return (await connection.raw("SHOW TABLES"))[0].map(
    (tableInfo) => tableInfo[`Tables_in_${databaseConfig.database}`],
  );
}

async function listTableIndexes(connection, tableName) {
  return (await connection.raw(`SHOW INDEX FROM ${tableName}`))[0].map(
    ({ Key_name }) => Key_name,
  );
}
/**
 * @brief Destroi uma conexão
 * */
function closeConnection(connectionName) {
  const conName = connectionName || "default";
  if (connections.has(conName)) {
    connections.get(conName).destroy();
    connections.delete(conName);
    console.info("Conexão fechada:", conName);
  }
}

/**
 * @brief cria uma tabela de acordo com um modelo
 **/
async function createTable(connection, model) {
  return connection.schema.createTable(model.tableName, (table) => {
    //insere as colunas
    for (const [columnName, columnDef] of model.columns) {
      columnDef.apply(connection, table, columnName);
    }

    //insere os indices
    for (const [idxName, indexDef] of model.indexes) {
      indexDef.apply(table, idxName);
    }
  });
}

/**
 * @brief altera uma tabela de acordo com um modelo
 **/
async function alterTable(connection, model) {
  const { tableName, columns, indexes } = model;
  //carrega a lista de colunas
  const tableColumns = await connection.table(tableName).columnInfo();
  //carrega a lista de indices
  const tableKeys = await listTableIndexes(connection, tableName);

  //NOTE: MySQL não retorna a coluna primária renomeada
  const hasPrimaryKey = tableKeys.includes("PRIMARY");

  await connection.schema.alterTable(tableName, (table) => {
    //Dropar apenas os indices que a tabela ja possui para poder atualizar
    let primaryDropped = false;
    for (const [idxKey, indexDef] of indexes) {
      if (indexDef instanceof Primary && hasPrimaryKey && !primaryDropped) {
        indexDef.drop(table, idxKey); //dropa a coluna primária no caso especial do MySQL
        primaryDropped = true;
      } else if (tableKeys.includes(indexDef.toIndexName(idxKey))) {
        indexDef.drop(table, idxKey);
      }
    }

    //Garantindo que a chave primária tenha sido dropada caso ela nn seja consequência direta de um index no model
    if (!primaryDropped && hasPrimaryKey) {
      table.dropPrimary();
    }

    for (const [columnName, columnDef] of columns) {
      if (columnName in tableColumns) {
        columnDef.alter(connection, table, columnName);
      } else {
        columnDef.apply(connection, table, columnName);
      }
    }

    //reinserir todos os indices
    for (const [idxKey, indexDef] of indexes) {
      indexDef.apply(table, idxKey);
    }
  });

  //encontra colunas a serem dropadas
  const updatedTableColumns = await connection.table(tableName).columnInfo();
  const usedColumns = columns.map(([columnName]) => columnName);
  const dropColumns = Object.keys(updatedTableColumns).filter(
    (col) => !usedColumns.includes(col),
  );
  if (dropColumns.length) {
    //TODO: dropar automaticamente colunas inválidas
    console.info(
      `[SYNC] Colunas a serem removidas em ${tableName}:`,
      dropColumns,
    );
  }
}

function loadModelInfo(modelFile) {
  //verifica o arquivo dentre os modelos 
  const modelPath = `../models/${modelFile}`; //caminho relativo ao arquivo atual
  const modelFileData = new RegExp(/^(?<name>.*)\.model.js$/).exec(modelFile);

  if (!modelFileData) {
    console.error("[SYNC] Modelo de entidade inválido, esperado <entity>.model.js");
    return null;
  }
  //carrega o modulo
  const modelModule = require(modelPath);

  if (!("modelInfo" in modelModule)) {
    console.error(
      "[SYNC] Modelo inválido: Não define export para dados do modelo `modelInfo`",
    );
    return null;
  }

  const { modelInfo } = modelModule;
  if (!(modelInfo instanceof Model)) {
    console.error("[SYNC] entidade inválida, deve extender ou implementar a class Model:", modelFile);
    return null;
  }

  return modelInfo;
}

/**
 * @brief sincroniza as colunas e indices das tabelas
 **/
async function sync() {
  // carregar todos os modulos de models (Tabelas)
  const modelFiles = fs.readdirSync("models", { recursive: false });
  const models = modelFiles
    .map((file) => loadModelInfo(file))
    .filter((model) => model);

  if (models.length == 0) {
    return;
  }

  //desabilitar chaves estrangeiras para começar a sincronização
  const connection = getConnection("Sync");
  const currentTables = await listTables(connection);
  const currentTableKeys = await Promise.all(
    currentTables.map((tableName) => listTableIndexes(connection, tableName)),
  );
  //dropar todas as chaves estrangeiras
  await Promise.all(
    currentTables.map((tableName, index) => {
      const foreignKeys = currentTableKeys[index].filter((item) =>
        item.endsWith("_fk")
        ,
      );
      const query = connection.schema.table(tableName, (table) => {
        foreignKeys.forEach((foreignKey) =>
          table.dropForeign([], foreignKey).dropIndex([], foreignKey),
        );
      });
      return query;
    }),
  );


  await Promise.all(
    models.map((model) => {
      if (!currentTables.includes(model.tableName)) {
        return createTable(connection, model);
      }
      return alterTable(connection, model);
    }),
  );

  //Lista as tabelas do banco de dados que não serão em uso
  const usedTables = models.map((model) => model.tableName);
  const dropTables = (await listTables(connection)).filter(
    (table) => !usedTables.includes(table),
  );
  if (dropTables.length) {
    console.info(`[SYNC] Tabelas a serem removidas:`, dropTables);
  }

  //reabilitar chaves estrangeiras para começar a sincronização
}

module.exports = {
  createConnection,
  getConnection,
  closeConnection,
  sync,
};
