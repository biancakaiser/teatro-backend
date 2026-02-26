const BaseRepository = require("../core/base_repository");
const { getConnection } = require("../core/database");
const { Session } = require("../entities/session.entity");
const { SessionModel } = require("../models/session.model");
const { UserModel } = require("../models/user.model");
const { flattenEntities } = require("../core/utils/objects");
const { User } = require("../entities/user.entity");

class SessionRepository extends BaseRepository {
  constructor() {
    super(SessionModel, getConnection());
  }

  async findByToken(token) {
    const userTable = UserModel.tableName
    const query = (await this.connection
      .select(this.tableColumns.map(colName => `${this.tableName}.${colName}`))
      .table(this.tableName)
      .innerJoin(`${userTable} as user`, "userId", "user.id")
      .select(["id", "firstName", "lastName", "role"].map(colName => `user.${colName} as user_${colName}`))
      .where("token", "=", token)
      .limit(1))[0];

    const session = new Session(flattenEntities(query));
    session.user = new User(session.user);

    return session;
  }
}

module.exports = new SessionRepository();
