const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require("express");
const bodyParser = require("body-parser");
const appConfig = require("./app_config.js");
const routes = require("./routes.js");
const database = require("./core/database.js");

const { server: serverConfig, environment } = appConfig;

const app = express();
app.set("trust proxy", true);
app.use(express.json({ limit: "10Mb" }));
app.use(bodyParser.json({ limit: "10Mb" }));
app.use("/v1", routes);

// sincronizar o banco de dados
if (appConfig.sync) {
  database
    .sync()
    .then(() => {
      console.info("Banco de dados sincronizado");
    })
    .catch((error) => {
      console.error("Erro ao sincronizar o banco de dados:", error);
    });
}

// Inicializar o servidor
app.listen(serverConfig.port, () => {
  console.info(
    `Teatro Backend API v${appConfig.majorVersion} (${environment}) running on localhost:${serverConfig.port}${serverConfig.path}`,
  );
  app.emit("serverConfigReady");
});
