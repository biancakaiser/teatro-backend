/* eslint-disable class-methods-use-this */
/* eslint-disable indent */
/* eslint-disable linebreak-style */
const bcrypt = require("bcrypt");
const { BaseEntity } = require("../core/base_entity");

/** @brief Enumerador de cargos de usuário* */
const UserRolesEnum = Object.freeze({ USER: "USER", ADMIN: "ADMIN" });

/** @brief Enumerador de status de usuário* */
const UserStatusEnum = Object.freeze({
  UNCONFIRMED_EMAIL: "UNCONFIRMED_EMAIL",
  IN_ANALYSIS: "IN_ANALYSIS",
  APPROVED: "APPROVED",
  SUSPENDED: "SUSPENDED",
  BANNED: "BANNED",
});

/** @brief Entidade usuário * */
class User extends BaseEntity {
  constructor(data) {
    super({
      email: null,
      password: null,
      firstName: null,
      lastName: null,
      dob: null, // DATE OF BIRTHDAY
      ...data,
    });
  }

  async validatePassword(password, passwordHash) {
    if (this.password && this.password.length) {
      return bcrypt.compare(password, this.password);
    }
    return bcrypt.compare(password, passwordHash);
  }

  async hashPassword() {
    if (this.password && !this.password.startsWith("$2b$12$")) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async beforeInsert() {
    // super.beforeInsert();
    await this.hashPassword();
  }

  async beforeUpdate() {
    super.beforeUpdate();

    await this.hashPassword();
  }


  sanitized() {
    const userSanitized = {
      ...this,
      emailConfirmationCode: undefined,
      password: undefined,
    };
    delete userSanitized.password;
    delete userSanitized.emailConfirmationCode;

    return userSanitized;
  }

  isAdmin() {
    return this.role === UserRolesEnum.ADMIN;
  }
}

module.exports = {
  User,
  UserRolesEnum,
  UserStatusEnum,
};
