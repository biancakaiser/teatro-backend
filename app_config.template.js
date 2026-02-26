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
  },
  database: {
    // configurações banco de dados
    socketPath: "$TYPEORM_SOCKET",
    port: 3306,
    user: "$TYPEORM_USERNAME",
    password: "$TYPEORM_PASSWORD",
    database: "teatro",
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
    const productionURL = "https://api.teatromusicadosp.com.br";
    const developmentURL = "https://teatro-api.launchpad.com.br";
    const localURL = `http://localhost:${config.server.port}`;
    // eslint-disable-next-line default-case
    switch (config.environment) {
      case "prod":
        return productionURL;
      case "dev":
        return developmentURL;
    }
    return localURL;
  },
};
