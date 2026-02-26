// const bcrypt = require("bcrypt");
const general = require("../core/utils/general.js");
// const database = require("../core/database.js");
const serverConfig = require("../app_config.js");
const Model = require("./base_model.js");
const Email = require("../email.js");

const userRoles = ["USER", "ADMIN"];
const userStatus = [
  "UNCONFIRMED_EMAIL",
  "IN_ANALYSIS",
  "APPROVED",
  "SUSPENDED",
  "BANNED",
];

module.exports = class extends (
  Model("User", {
    id: (table, col) => table.varchar(col, { primaryKey: true }),
    email: (table, col) => table.varchar(col),
    password: (table, col) => table.varchar(col),
    role: (table, col) => table.enum(col, userRoles),
    firstName: (table, col) => table.varchar(col),
    lastName: (table, col) => table.varchar(col),
    status: (table, col) => table.enum(col, userStatus),
    creationDate: (table, col) => table.timestamp(col, { precision: 6 }),
    emailConfirmationCode: null,
    dob: null,
    cpf: "",
  })
) {
  constructor(dataObject = null) {
    super(dataObject);
    if (!this.creationDate) this.creationDate = general.makeDateTime();
    this.currentToken = null;
  }

  async setBasicInfo({
    email, firstName, lastName, role, dob, cpf, password,
  }) {
    this.email = email;
    this.role = role;
    this.firstName = firstName;
    this.lastName = lastName;
    this.dob = dob;
    this.cpf = cpf;
    this.emailConfirmationCode = await general.createRandomHash();

    return this.setPassword(password);
  }

  async setName(firstName, lastName) {
    this.firstName = firstName;
    this.lastName = lastName;
    return this;
  }

  async isAdmin() {
    return this.role === "ADMIN";
  }

  async getCurrentToken() {
    if (this.currentToken === null) {
      throw Error("ERR_NO_CURRENT_TOKEN");
    }
    return this.currentToken;
  }

  async setCurrentToken(token) {
    this.currentToken = token;
    return this;
  }

  async setRole(role) {
    if (userRoles.includes(role)) {
      this.role = role;
      return this;
    }
    throw Error("ERR_USER_INVALID_ROLE");
  }

  async setStatus(status) {
    if (userStatus.includes(status)) {
      this.status = status;
      return this;
    }
    throw Error("ERR_USER_INVALID_STATUS");
  }

  async confirmEmail() {
    this.emailConfirmationCode = null;
    if (this.status === "UNCONFIRMED_EMAIL") {
      this.status = userStatus[1]; // eslint-disable-line
    }
    return this;
  }

  async sendConfirmationEmail() {
    await Email.sendEmailWithTemplate(
      { Name: this.firstName, Email: this.email },
      296011,
      {
        emailConfirmationUrl: `${serverConfig.getWebsiteURL()}/user-confirm-email.html?code=${this.emailConfirmationCode}`,
      },
      "Confirmação de email",
    );
    return this;
  }

  async setPassword(password) {
    // rounds -> tempo
    // 13 -> 570ms
    // 12 -> 290ms
    // 11 -> 150ms
    const rounds = 12;
    const passwordHash = await bcrypt.hash(password, rounds);
    this.password = passwordHash;
    return this;
  }

  async validatePassword(password) {
    if (await bcrypt.compare(password, this.password)) {
      return true;
    }
    return false;
  }

  async createSession() {
    const token = await general.createRandomHash(this.id);
    const session = {
      token,
      id: null,
      creationDate: general.makeDateTime(),
      expirationDate: null,
      userId: this.id,
    };

    await database("Session").insert(session);

    return token;
  }

  async revokeCurrentToken() {
    const numRowsAffected = await database("Session")
      .where({
        userId: this.id,
        token: await this.getCurrentToken(),
      })
      .del();

    if (numRowsAffected) {
      await this.setCurrentToken(null);
      return this;
    }

    throw Error("ERR_TOKEN_NOT_FOUND");
  }

  static async findByEmail(email) {
    return this.findOne({ email });
  }
};
