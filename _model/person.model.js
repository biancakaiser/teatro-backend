const { getConnection } = require("../core/database.js");

const database = getConnection();

const Model = require("./base_model.js");
const Resource = require("./resource.model.js");
const Role = require("./role.model.js");
const Nationality = require("./nationality.model.js");

const genders = ["M", "F", "O"];
const races = ["BRANCA", "PRETA", "AMARELA", "PARDA", "INDIGENA"];

module.exports = class extends (
  Model("Person", {
    id: null,
    visible: 0,
    civilName: "",
    artistName: "",
    gender: null,
    race: null,
    roleId: null,
    expertise: "",
    birthDate: null,
    birthPlace: "",
    deathDate: "",
    deathPlace: "",
    personalPath: "",
    professionalPath: "",
    notes: "",
    bibliography: "",
    citation: "",
    nationalityId: null,
  })
) {
  constructor(dataObject = null) {
    super(dataObject);
  }

  async setBasicInfo({
    visible,
    civilName,
    artistName,
    gender,
    race,
    roleId,
    expertise,
    nationalityId,
    birthDate,
    birthPlace,
    deathDate,
    deathPlace,
    personalPath,
    professionalPath,
    notes,
    bibliography,
    citation,
  }) {
    this.visible = visible;
    this.civilName = civilName;
    this.artistName = artistName;
    this.roleId = roleId;
    this.expertise = expertise;
    this.nationalityId = nationalityId;
    this.birthDate = birthDate;
    this.birthPlace = birthPlace;
    this.deathDate = deathDate;
    this.deathPlace = deathPlace;
    this.personalPath = personalPath;
    this.professionalPath = professionalPath;
    this.notes = notes;
    this.bibliography = bibliography;
    this.citation = citation;

    if (genders.includes(gender)) this.gender = gender;
    if (races.includes(race)) this.race = race;

    return this;
  }

  async getInfo() {
    const result = this.dataObject;

    if (this.roleId) result.role = await Role.getRole(this.roleId);
    if (this.expertiseId) { result.expertise = await Role.findById(this.expertiseId); }
    if (this.nationalityId) { result.nationality = await Nationality.getName(this.nationalityId); }

    return result;
  }

  async getConceptions() {
    return database("Conception").where("personId", "=", this.id);
  }

  async getPictures() {
    const resourceRelations = await database("ResourceRelation").where(
      "personId",
      "=",
      this.id,
    );

    const pictures = await Promise.all(
      resourceRelations.map(async relation => Resource.findByUUID(relation.UUID)),
    );

    if (pictures[0]) {
      const picturesWithUrl = await Promise.all(
        pictures.map(async (pic) => {
          const picture = await pic[0].getData();
          picture.url = await Resource.getUrl(picture.UUID);
          return picture;
        }),
      );

      return picturesWithUrl;
    }

    return [];
  }

  async attachPicture(req) {
    const localResource = await Resource.saveLocal(req, { personId: this.id });
    await Resource.saveRemote(localResource, this.id);
    await database("ResourceRelation").insert({
      UUID: localResource.UUID,
      personId: this.id,
    });

    return localResource.UUID;
  }

  async removePicture(UUID) {
    await database("ResourceRelation")
      .where("UUID", "=", UUID)
      .andWhere("personId", "=", this.id)
      .delete();
  }

  static async addJob(data) {
    return database("Job").insert(data);
  }

  async getJobs() {
    const jobs = await database("Job").where("personId", "=", this.id);
    return jobs;
  }

  static async removeJob(idJob) {
    await database("Job").where("id", "=", idJob).delete();
  }

  static async updateJob(data) {
    return database("Job").where("id", "=", data.jobId).update({
      firstDate: data.firstDate,
      lastDate: data.lastDate,
    });
  }

  static async addRole(role) {
    const exists = await database("Role").where({ name: role });
    if (exists.length === 0) {
      const roleId = await database("Role").insert({ name: role });
      return roleId[0];
    }

    return exists[0].id;
  }

  static async getRole(id) {
    const role = await Role.getRole(id);
    return role;
  }

  static async getCount() {
    return database("Person").count("id");
  }
};
