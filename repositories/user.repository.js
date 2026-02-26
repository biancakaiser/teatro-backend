const BaseRepository = require("../core/base_repository.js");
const { getConnection } = require("../core/database.js");
const { UserModel } = require("../models/user.model.js");

class UserRepository extends BaseRepository {
  constructor() {
    super(UserModel, getConnection());
  }

  async findByEmail(email) {
    return this.findOne({ email });
  }
}

module.exports = new UserRepository();
