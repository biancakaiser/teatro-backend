const Model = require("./base_model.js");
const Resource = require("./resource.model.js");
const { getConnection } = require("../core/database.js");
const database = getConnection();

module.exports = class extends (
  Model("Theater", {
    id: null,
    name: "",
    foundationAddress: "",
    foundationDate: null,
    neighborhood: "",
    currentAddress: "",
    dissolutionDate: null,
    dissolutionReason: "",
    seatsNumber: 0,
    kind: "",
    history: "",
    notes: "",
    bibliography: "",
    otherNames: "",
  })
) {
  constructor(dataObject = null) {
    super(dataObject);
  }

  async setBasicInfo({
    name,
    foundationAddress,
    foundationDate,
    neighborhood,
    currentAddress,
    dissolutionDate,
    dissolutionReason,
    seatsNumber,
    kind,
    history,
    bibliography,
    otherNames,
    notes,
  }) {
    this.name = name;
    this.foundationAddress = foundationAddress;
    this.foundationDate = foundationDate;
    this.neighborhood = neighborhood;
    this.currentAddress = currentAddress;
    this.dissolutionDate = dissolutionDate;
    this.dissolutionReason = dissolutionReason;
    this.seatsNumber = seatsNumber;
    this.kind = kind;
    this.history = history;
    this.bibliography = bibliography;
    this.otherNames = otherNames;
    this.notes = notes;
  }

  async getInfo() {
    return this.dataObject;
  }

  async getPictures() {
    const resourceRelations = await database("ResourceRelation").where(
      "theaterId",
      "=",
      this.id,
    );
    const pictures = await Promise.all(
      resourceRelations.map(async (relation) =>
        Resource.findByUUID(relation.UUID),
      ),
    );
    // console.log("TCL: extends -> getPictures -> pictures", pictures)

    if (pictures[0]) {
      const picturesWithUrl = await Promise.all(
        pictures.map(async (pic) => {
          try {
            const picture = pic[0].getData();
            picture.url = await Resource.getUrl(picture.UUID);
            return picture;
          } catch (error) {
            console.error(error);
            return null;
          }
        }),
      );

      return picturesWithUrl.filter((pic) => pic !== null);
    }

    return [];
  }

  async getResponsibles() {
    return database("Responsible").where("theaterId", "=", this.id);
  }

  static async removeResponsible(id) {
    await database("Responsible").where("id", "=", id).delete();
  }

  async attachPicture(req) {
    const localResource = await Resource.saveLocal(req, { theaterId: this.id });
    await Resource.saveRemote(localResource, this.id);
    await database("ResourceRelation").insert({
      UUID: localResource.UUID,
      theaterId: this.id,
    });

    return localResource.UUID;
  }

  async removePicture(UUID) {
    await database("ResourceRelation")
      .where("UUID", "=", UUID)
      .andWhere("theaterId", "=", this.id)
      .delete();
  }

  static async findByName(name) {
    return this.findMultiple({ name: `%${name}%` }, true);
  }

  static async getAll() {
    return this.findAll();
  }

  static async getCount() {
    return database("Theater").count("id");
  }

  static async findByAddress(address) {
    let foundTheaters = [];

    const foundationAddresses = await this.findMultiple(
      { foundationAddress: `%${address}%` },
      true,
    );
    const currentAddresses = await this.findMultiple(
      { currentAddress: `%${address}%` },
      true,
    );

    foundTheaters = foundTheaters.concat(foundationAddresses);
    foundTheaters = foundTheaters.concat(currentAddresses);

    return foundTheaters;
  }
};
