const BaseRepository = require("../core/base_repository.js");
const { getConnection } = require("../core/database.js");
const { TheaterModel } = require("../models/theater.model.js");

class TheatherRepository extends BaseRepository {
  constructor() {
    super(TheaterModel, getConnection());
  }
}

module.exports = new TheatherRepository();
