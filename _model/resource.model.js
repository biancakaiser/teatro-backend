const uuidv4 = require("uuid/v4");

const general = require("../core/utils/general.js");
const Model = require("./base_model.js");
const upload = require("../upload.js");

// const sources = ["REMOTE", "LOCAL"];

class Resource extends Model("Resource", {
  id: null,
  UUID: null, // always string
  fileName: "",
  source: true,
  size: null,
  contentType: "",
  creationDate: null,
  private: 0,
  description: "",
  origin: "",
}) {
  constructor(dataObject = null) {
    super(dataObject);
    if (!this.UUID) this.UUID = uuidv4();
    if (!this.creationDate) this.creationDate = general.makeDateTime();
  }

  async makePrivate() {
    this.private = 1;
    if (this.source === "REMOTE") await upload.makePrivateRemote(this.fileName);

    await this.save();
  }

  async makePublic() {
    this.private = 0;
    if (this.source === "REMOTE") await upload.makePublicRemote(this.fileName);

    await this.save();
  }

  static async getUrl(UUID) {
    const resource = await module.exports.findOne({ UUID });
    if (!resource) throw Error("ERR_NOT_FOUND");
    if (resource.private) throw Error("FORBIDDEN");

    const existsRemote = await upload.checkRemoteExistence(resource.fileName);
    if (existsRemote) return upload.getRemoteUrl(resource.fileName);

    // const existsLocal = await upload.checkLocalExistence(resource.fileName);
    // if (existsLocal) return upload.getLocalUrl(resource.fileName);
    throw Error("ERR_NOT_FOUND");
  }

  static async remove(UUID) {
    const resources = await this.findByUUID(UUID);
    await resources.forEach(resource => resource.makePrivate());
  }

  // Recebe um arquivo por requisição multipart/form-data e salva no diretório especificado.
  // Limite do tamanho do arquivo pode ser especificado em mebibytes (1024*1024 bytes).
  static async saveLocal(request, data, fileSizeLimit = 10) {
    const localResource = new Resource();
    localResource.fileName = await general.createRandomHash(this.UUID);

    const resourceRelation = Object.assign(data);
    resourceRelation.UUID = localResource.UUID;
    try {
      const { size, mimetype } = await upload.local(request, {
        fileSizeLimit,
        fileName: localResource.fileName,
        fileTypes: /jpeg|jpg|png/,
      });

      localResource.source = "LOCAL";
      localResource.size = size;
      localResource.contentType = mimetype;

      // await database("ResourceRelation").insert(resourceRelation);

      return localResource;
    } catch (error) {
      switch (error.message) {
        case "BAD_FILETYPE":
          throw Error("ERR_API_UPLOAD_FILETYPE");

        case "LIMIT_UNEXPECTED_FILE":
          throw Error("ERR_API_UPLOAD_FILENAME");

        default:
          console.error(error);
          throw Error("ERR_API_UPLOAD");
      }
    }
  }

  // Recebe um arquivo local e salva na Google Cloud
  static async saveRemote(localResource) {
    const remoteResource = new Resource();

    await upload.remote(localResource);
    await upload.makePublicRemote(localResource.fileName);

    remoteResource.source = "REMOTE";
    remoteResource.fileName = localResource.fileName;
    remoteResource.size = localResource.size;
    remoteResource.contentType = localResource.contentType;
    remoteResource.UUID = localResource.UUID;

    return remoteResource.save();
  }

  static async updateInfo(UUID, description, origin) {
    const resources = await this.findByUUID(UUID);
    await Promise.all(
      resources.map(async (resource) => {
        if (description) resource.description = description; // eslint-disable-line
        if (origin) resource.origin = origin; // eslint-disable-line
        await resource.save();
      }),
    );
  }

  static async findByUUID(UUID) {
    return this.findMultiple({ UUID });
  }
}

module.exports = Resource;
