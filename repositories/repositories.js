const BaseRepository = require("../core/base_repository");
const { getConnection } = require("../core/database");

const { CompanyModel } = require("../models/company.model");
const { ConceptionModel } = require("../models/conception.model");
const { GenreModel } = require("../models/genre.model");
const { JobModel } = require("../models/job.model");
const { LanguageModel } = require("../models/language.model");
const { NationalityModel } = require("../models/nationality.model");
const { PageModel } = require("../models/page.model");
const { PersonModel } = require("../models/person.model");
const { PlayModel } = require("../models/play.model");
const { PresentationModel } = require("../models/presentation.model");
const { ResourceModel } = require("../models/resource.model");
const { ResourceRelationModel } = require("../models/resource_relation.model");
const { ResponsibleModel } = require("../models/responsible.model");
const { RoleModel } = require("../models/role.model");
const { SessionModel } = require("../models/session.model");
const { SettingModel } = require("../models/setting.model");
const { TheaterModel } = require("../models/theater.model");
const { UserModel } = require("../models/user.model");


module.exports = {
	UserBaseRepo: new BaseRepository(UserModel, getConnection()),
	TheaterBaseRepo: new BaseRepository(TheaterModel, getConnection()),
	SettingBaseRepo: new BaseRepository(SettingModel, getConnection()),
	SessionBaseRepo: new BaseRepository(SessionModel, getConnection()),
	RoleBaseRepo: new BaseRepository(RoleModel, getConnection()),
	ResponsibleBaseRepo: new BaseRepository(ResponsibleModel, getConnection()),
	ResourceRelationBaseRepo: new BaseRepository(ResourceRelationModel, getConnection()),
	ResourceBaseRepo: new BaseRepository(ResourceModel, getConnection()),
	PresentationBaseRepo: new BaseRepository(PresentationModel, getConnection()),
	PlayBaseRepo: new BaseRepository(PlayModel, getConnection()),
	PersonBaseRepo: new BaseRepository(PersonModel, getConnection()),
	PageBaseRepo: new BaseRepository(PageModel, getConnection()),
	NationalityBaseRepo: new BaseRepository(NationalityModel, getConnection()),
	LanguageBaseRepo: new BaseRepository(LanguageModel, getConnection()),
	JobBaseRepo: new BaseRepository(JobModel, getConnection()),
	GenreBaseRepo: new BaseRepository(GenreModel, getConnection()),
	ConceptionBaseRepo: new BaseRepository(ConceptionModel, getConnection()),
	CompanyBaseRepo: new BaseRepository(CompanyModel, getConnection()),
};
