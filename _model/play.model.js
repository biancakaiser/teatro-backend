const Model = require("./base_model.js");
const Setting = require("./setting.model.js");
const Conception = require("./conception.model.js");
const Resource = require("./resource.model.js");

const { getConnection } = require("../core/database.js");

const database = getConnection();

module.exports = class extends (
  Model("Play", {
    id: null,
    originalName: "",
    globalFirstDate: null,
    spFirstDate: null,
    pressReleases: "",
    pressReviews: "",
    bibliography: "",
    source: "",
    citation: "",
    genreId: null,
    nationalityId: null,
    languageId: null,
    authorId: null,
    visible: 1,
    name: "",
    referencePlay: "",
  })
) {
  constructor(dataObject = null) {
    super(dataObject);
  }

  async addSetting(company) {
    const setting = new Setting();
    setting.setPlay(this);
    setting.setCompany(company);
    await setting.save();
  }

  async removeSetting(setting) {
    if (setting.playId !== this.id) {
      throw Error("WRONG_PLAY");
    }
    await setting.remove();
  }

  async listSettings() {
    return Setting.findByPlay(this);
  }

  async addConception(person, role) {
    const conception = new Conception();
    conception.setPlay(this);
    conception.setPerson(person);
    conception.setRole(role);
    await conception.save();

    return conception;
  }

  async removeConception(conception) {
    if (conception.playId !== this.id) {
      throw Error("WRONG_SETTING");
    }
    await conception.remove();
  }

  async listConceptions() {
    return Conception.findByPlay(this);
  }

  static async getCount() {
    return database("Play").count("id");
  }

  async getPictures() {
    const resourceRelations = await database("ResourceRelation").where(
      "playId",
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
    const localResource = await Resource.saveLocal(req, { playId: this.id });
    await Resource.saveRemote(localResource, this.id);

    await database("ResourceRelation").insert({
      UUID: localResource.UUID,
      playId: this.id,
    });

    return localResource.UUID;
  }

  async removePicture(UUID) {
    await database("ResourceRelation")
      .where("UUID", "=", UUID)
      .andWhere("playId", "=", this.id)
      .delete();
  }

  async getInfo() {
    return this.dataObject;
  }
};
