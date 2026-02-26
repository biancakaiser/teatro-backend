/* eslint func-names: off */
const { getConnection } = require("../core/database.js");
const database = getConnection();

const modelTest = require("./model/model.test.js");
const apiTest = require("./api/api.test.js");

describe("Integration tests", function () {
  this.timeout(10000);

  describe("Model tests", modelTest);

  describe("API tests", apiTest);

  after(() => {
    database.closeConnection();
  });
});
