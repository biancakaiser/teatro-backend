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
    // socketPath: process.env.TYPEORM_SOCKET,
    host: process.env.TYPEORM_HOST || "127.0.0.1",
    port: Number(process.env.TYPEORM_PORT) || 3306,
    user: process.env.TYPEORM_USERNAME || "root",
    password: process.env.TYPEORM_PASSWORD,
    database: "teatro",
  },
  sync: false,
};

console.log(config);

module.exports = {
  ...config,
  isProdEnv: () => config.environment === "prod",
  isDevEnv: () => ["dev", "local"].includes(config.environment),
  isTestEnv: () => config.environment === "test",
  // Retorna URL do site
  getWebsiteURL: () => {
    const productionURL = "https://api.teatromusicadosp.com.br";
    const developmentURL = "https://teatro-backend-dev-ayztplarvq-ue.a.run.app";
    const localURL = `http://localhost:${config.server.port}`;
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
