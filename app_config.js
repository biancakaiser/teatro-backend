/* eslint-disable indent */
// eslint-disable-next-line global-require
const packageInfo = require("./package.json"); 

const { version, name } = packageInfo;
const majorVersion = version.split(".")[0];
// configurações da aplicação
const config = {
  name,
  version,
  majorVersion,
  commit: process.argv[4] || "local",
  environment: process.env.NODE_ENV || process.argv[2] || "local",
  server: {
    // configurações do servidor
    path: `/v${majorVersion}`,
    port: process.argv[3] || 8089,
    checkOrigin: origin => true,
    devURL: process.env.DEV_URL,
    prodURL: process.env.PROD_URL,
    localURL: process.env.LOCAL_URL,
  },
  database: {
    //socketPath: process.env.TYPEORM_SOCKET || "",
    host: process.env.TYPEORM_HOST || "127.0.0.1",
    port: Number(process.env.TYPEORM_PORT) || 3306,
    user: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
  },
  sync: false,
};

module.exports = {
  ...config,
  isProdEnv: () => config.environment === "prod",
  isDevEnv: () => ["dev", "local"].includes(config.environment),
  isTestEnv: () => config.environment === "test",
  // Retorna URL do site
  getWebsiteURL: () => {
    const productionURL = config.server.prodURL;
    const developmentURL = config.server.devURL;
    const localURL = config.server.localURL;
    // eslint-disable-next-line default-case
    switch (config.environment) {
      case "prod":
        return productionURL;
      case "dev":
        return developmentURL;
      case "local":
        return localURL;
    }
  },
};
