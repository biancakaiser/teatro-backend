/* eslint-disable linebreak-style */
/* eslint-disable indent */
/* eslint-disable class-methods-use-this */
const BaseRepository = require("../core/base_repository");
const { getConnection } = require("../core/database");
const upload = require("../upload");
const { ResourceModel } = require("../models/resource.model");
const { ResourceRelationModel } = require("../models/resource_relation.model");
const { Resource } = require("../entities/resource.entity");
const { createRandomHash } = require("../core/utils/general");

class ResourceRepository extends BaseRepository {
  constructor() {
    const connection = getConnection();
    super(ResourceModel, connection);
    this.relations = new BaseRepository(ResourceRelationModel, connection);
  }

  async makePrivate(resource) {
    // eslint-disable-next-line no-param-reassign
    resource.private = 1;
    if (resource.source === "REMOTE") {
      await upload.makePrivateRemote(resource.fileName);
    }

    return this.update(resource, ["private"]);
  }

  async makePublic(resource) {
    // eslint-disable-next-line no-param-reassign
    resource.private = 0;
    if (resource.source === "REMOTE") {
      await upload.makePublicRemote(resource.fileName);
    }

    return this.update(resource, ["private"]);
  }

  async saveLocal(request, data, fileSizeLimit = 10) {
    const localResource = new Resource({
      source: "LOCAL",
      fileName: await createRandomHash(String(Math.random())),
      creationDate: new Date(),
    });

    try {
      const { size, mimetype } = await upload.local(request, {
        fileSizeLimit,
        fileName: localResource.fileName,
        fileTypes: /jpeg|jpg|png/,
      });

      localResource.size = size;
      localResource.contentType = mimetype;
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

    return localResource;
  }

  async delete(UUID) {
    await this.queryBuilder((qb) => {
      qb.where("UUID", "=", UUID).delete();
    });

    await this.relations.queryBuilder((qb) => {
      qb.where("UUID", "=", UUID).delete();
    });
  }

  async saveRemote(localResource) {
    await upload.remote(localResource);
    // eslint-disable-next-line no-param-reassign
    localResource.source = "REMOTE";
    const remoteResource = (await this.insert(localResource))[0];
    return this.makePublic(remoteResource);
  }

  async findPictures(entity) {
    const entityName = entity.tableName.toLowerCase();
    if (!["company", "person", "theater", "play"].includes(entityName)) {
      throw new Error("Entidade inválida para busca de recursos");
    }

    const entityField = `${entityName}Id`;

    const resources = await this.relations.queryBuilder((qb) => {
      qb.where(entityField, "=", entity.id);
    });

    const pictures = await this.queryBuilder((qb) => {
      qb.whereIn(
        "UUID",
        resources.map(({ UUID }) => UUID),
      )
        .whereIn("contentType", ["image/png", "image/jpg", "image/jpeg"])
        .where("private", false);
    });

    const pictureResources = await Promise.all(
      pictures.map(async (picture) => {
        let url = null;
        try {
          const existsRemote = await upload.checkRemoteExistence(
            picture.fileName,
          );
          if (existsRemote) url = upload.getRemoteUrl(picture.fileName);
        } catch (error) {
          console.error("RESOURCE ERROR:", error);
        }
        return new Resource({ ...picture, url });
      }),
    );

    return pictureResources.filter(({ url }) => !!url);
  }
}

module.exports = new ResourceRepository();
