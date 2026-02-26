const {
  BaseEntityModel,
  defineColumn,
  defineForeign,
  Model,
  defineIdColumn,
} = require("../core/base_model");

const { Setting, SettingKindEnum } = require("../entities/setting.entity");

const { PlayModel } = require("./play.model");
const { CompanyModel } = require("./company.model");
const { GenreModel } = require("./genre.model");
const { LanguageModel } = require("./language.model");

const SettingModel = new Model(Setting,
  ...BaseEntityModel,
  {
    playId: defineIdColumn(true),
    settingPlay: defineForeign("playId", `${PlayModel.tableName}.id`, {}),

    companyId: defineIdColumn(true),
    settingCompany: defineForeign("companyId", `${CompanyModel.tableName}.id`, {}),

    genreId: defineIdColumn(true),
    settingGenre: defineForeign("genreId", `${GenreModel.tableName}.id`, {}),

    languageId: defineIdColumn(true),
    settingLanguage: defineForeign("languageId", `${LanguageModel.tableName}.id`, {}),
  },
  {
    year: defineColumn("varchar", 4, undefined, true),
    kind: defineColumn("enu", Object.values(SettingKindEnum), undefined, true),
  }).freeze();

module.exports = {
  SettingModel,
  modelInfo: SettingModel, //exportação padrão para sync
};
