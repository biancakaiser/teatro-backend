const {
  Model,
  BaseEntityModel,
  defineColumn,
  defineIndex,
  defineUnique,
} = require("../core/base_model.js");
const {
  UserRolesEnum,
  UserStatusEnum,
  User,
} = require("../entities/user.entity.js");

const UserModel = new Model(User, ...BaseEntityModel,
  {
    indexEmail: defineIndex(["email"]),
    uniqueEmail: defineUnique(["email"]),
  },
  {
    firstName: defineColumn("varchar", {}, undefined, false),
    lastName: defineColumn("varchar", {}, undefined, false),
    email: defineColumn("varchar"),
    password: defineColumn("varchar"),
    dob: defineColumn("date", {}, undefined, false),
    role: defineColumn("enu", Object.values(UserRolesEnum)),
    status: defineColumn("enu", Object.values(UserStatusEnum)),
    cpf: defineColumn("varchar", 14, undefined, true),
    emailConfirmationCode: defineColumn("varchar", 8, undefined, true),
  }).freeze();

module.exports = {
  UserModel,
  modelInfo: UserModel, //exportação padrão para sync
};
