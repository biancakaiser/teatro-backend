const {
  BaseEntityModel,
  defineColumn,
  defineIndex,
  defineUnique,
  defineForeign,
  Model,
  defineIdColumn,
} = require("../core/base_model");
const { Session } = require("../entities/session.entity");
const { UserRolesEnum, UserStatusEnum } = require("../entities/user.entity");

const SessionModel = new Model(Session,
  ...BaseEntityModel,
  {
    //indices
    indexToken: defineIndex(["token"]),
    uniqueToken: defineUnique(["token"]),
  },
  {
    token: defineColumn("varchar", {}, undefined, false),
  },
  {
    userId: defineIdColumn(false),
    user: defineForeign("userId", "User.id"),
  }).freeze();

module.exports = {
  SessionModel,
  modelInfo: SessionModel, //exportação padrão para sync
};
