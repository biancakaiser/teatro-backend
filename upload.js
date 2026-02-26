const GStorage = require("@google-cloud/storage");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const general = require("./core/utils/general");
const appConfig = require("./app_config");


// Google Storage
const developmentGoogleKeys = require("./google_key_dev.json");

let productionGoogleKeys;

if (appConfig.isProdEnv()) {
	try {
		// eslint-disable-next-line global-require
		productionGoogleKeys = require("./google_key_prod.json");
	} catch (error) {
		throw Error("GOOGLE STORAGE PRODUCTION KEYS NOT FOUND");
	}
}

const googleStorageKeys = appConfig.isProdEnv() ? productionGoogleKeys : developmentGoogleKeys;
const projectId = appConfig.isProdEnv() ? "espresso-prod" : "espresso-dev";
const bucketName = appConfig.isProdEnv() ? "static.teatromusicadosp.com.br" : appConfig.name;

// ////////////////////////////////////////////////////////
// Google initialization
//
// ////////////////////////////////////////////////////////
const gStorage = new GStorage({
	projectId,
	credentials: googleStorageKeys,
});


// if (!appConfig.isProdEnv()) {
// 	gStorage.createBucket(bucketName, {
// 		location: "SOUTHAMERICA-EAST1",
// 		storageClass: "REGIONAL",
// 	})
// 		.then(() => {
// 			console.info(`Bucket ${bucketName} created.`);
// 		})
// 		.catch((error) => {
// 			if (error.code === "ENOTFOUND") {
// 				console.error("GOOGLE STORAGE UNAVAILABLE");
// 			} else if (error.code !== 409) {
// 				console.error("GOOGLE STORAGE ERROR:", error);
// 			}
// 		});
// }

module.exports.bucketName = bucketName;


// //////////////////////////////////////////////////////
// Util functions
//
// //////////////////////////////////////////////////////

module.exports.checkRemoteExistence = async fileName => gStorage
	.bucket(bucketName)
	.file(fileName)
	.exists()
	.then(([exists]) => exists)
	.catch((error) => {
		console.error("[UPLOAD checkRemoteExistence]", error);
		return false;
	});

module.exports.checkLocalExistence = async (fileName) => {
	const checkLocalExistence = general.middlewareToPromise(fs.access);

	try {
		const existsLocal = await checkLocalExistence(`./temp_uploads/${fileName}`);
		return true;
	} catch (error) {
		if (error.code === "ENOENT") throw Error("ERR_NOT_FOUND");
		throw error;
	}
};

module.exports.getRemoteUrl = fileName => `https://storage.googleapis.com/${bucketName}/${fileName}`;
module.exports.getLocalUrl = fileName => `${appConfig.getWebsiteURL()}${appConfig.server.path}/resource/${fileName}`;


// //////////////////////////////////////////////////////
// File upload
//
// //////////////////////////////////////////////////////
module.exports.remote = async file => gStorage
	.bucket(bucketName)
	.upload(`./temp_uploads/${file.fileName}`, {
		gzip: true, // Support for HTTP requests made with `Accept-Encoding: gzip`
		metadata: {
			contentType: file.contentType,
		},
	})
	.catch((error) => {
		if (error.code === "ENOTFOUND") {
			console.error("GOOGLE STORAGE UNAVAILABLE");
		} else {
			console.error("GOOGLE STORAGE ERROR:", error);
		}
	});

module.exports.makePublicRemote = async fileName => gStorage
	.bucket(bucketName)
	.file(fileName)
	.makePublic();

module.exports.makePrivateRemote = async fileName => gStorage
	.bucket(bucketName)
	.file(fileName)
	.makePrivate();


module.exports.local = async (request, { fileName, fileSizeLimit, fileTypes = /jpeg|jpg|png/ }) => {
	const diskStorage = multer.diskStorage({
		destination: (_, _file, cb) => cb(null, "./temp_uploads/"),
		filename: async (_, _file, cb) => cb(null, fileName),
	});

	const uploadOptions = multer({
		storage: diskStorage,
		limits: {
			fileSize: fileSizeLimit * 1048576,
		},
		fileFilter: (_, file, cb) => {
			const mimetype = fileTypes.test(file.mimetype);
			const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
			if (mimetype && extname) {
				return cb(null, true);
			}
			return cb(Error("BAD_FILETYPE"));
		},
	});

	const localUpload = general.middlewareToPromise(uploadOptions.single("file"));

	const [result] = await localUpload(request);
	return result.file;
};
