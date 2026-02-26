const Model = require("./base_model.js");
const Resource = require("./resource.model.js");

const { getConnection } = require("../core/database.js");

const database = getConnection();

const Nationality = require("./nationality.model.js");

module.exports = class extends (
  Model("Company", {
    id: null,
    name: "",
    otherNames: "",
    foundationDate: null,
    foundationPlace: "",
    dissolutionDate: null,
    path: "",
    notes: "",
    bibliography: "",
    citation: "",
    nationalityId: null,
    visible: 1,
  })
) {
  async attachPicture(req) {
    const localResource = await Resource.saveLocal(req, { companyId: this.id });
    await Resource.saveRemote(localResource, this.id);
    await database("ResourceRelation").insert({
      UUID: localResource.UUID,
      companyId: this.id,
    });
    return localResource.UUID;
  }

  async removePicture(UUID) {
    await database("ResourceRelation")
      .where("UUID", "=", UUID)
      .andWhere("companyId", "=", this.id)
      .delete();
  }

  async getInfo() {
    const info = this.dataObject;

    if (this.nationalityId) { info.nationality = await Nationality.getName(this.nationalityId); }

    return info;
  }

  async getJobs() {
    return database("Job").where("companyId", "=", this.id);
  }

  async getPictures() {
    const resourceRelations = await database("ResourceRelation").where(
      "companyId",
      "=",
      this.id,
    );
    const pictures = await Promise.all(
      resourceRelations.map(async relation => Resource.findByUUID(relation.UUID)),
    );

    if (pictures[0]) {
      const picturesWithUrl = await Promise.all(
        pictures.map(async (pic) => {
          const picture = pic[0].getData();
          picture.url = await Resource.getUrl(picture.UUID);
          return picture;
        }),
      );

      return picturesWithUrl;
    }

    return [];
  }

  static async getCount() {
    return database("Company").count("id");
  }
};
