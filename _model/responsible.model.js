const Model = require("./base_model.js");

const roles = ["OWNER", "TENANT", "BUSINESS", "MANAGER", "COMPANY"];

module.exports = class extends (
  Model("Responsible", {
    id: null,
    theaterId: 0,
    personId: 0,
    firstDate: null,
    lastDate: null,
    role: "",
    name: "",
  })
) {
  constructor(dataObject = null) {
    super(dataObject);
  }

  async setBasicInfo({ theaterId, personId, firstDate, lastDate, role, name }) {
    this.theaterId = theaterId;
    this.personId = personId;
    this.firstDate = firstDate;
    this.lastDate = lastDate;
    this.name = name;

    if (roles.includes(role)) this.role = role;
  }

  async getInfo() {
    return this.dataObject;
  }

  async findByTheater(theater) {
    return this.findMultiple({ theaterId: theater.id });
  }
};
