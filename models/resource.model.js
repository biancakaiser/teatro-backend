const { BaseEntityModel, Model, defineColumn } = require("../core/base_model");
const { Resource } = require("../entities/resource.entity");

const ResourceModel = new Model(Resource, ...BaseEntityModel, {
  // Colunas
  UUID: defineColumn("varchar", 36),
  fileName: defineColumn("varchar"),
  private: defineColumn("boolean", {}, "0", false),
  sponsor: defineColumn("boolean", {}, "0", false),
  source: defineColumn("varchar", 45),
  size: defineColumn("integer", 11),
  contentType: defineColumn("varchar", 45),
  origin: defineColumn("text", {}, "", true),
  description: defineColumn("text", {}, "", true),
});

module.exports = {
  ResourceModel,
  modelInfo: ResourceModel,
};
