const { S3Client, PutObjectCommand, HeadObjectCommand, PutObjectAclCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const general = require("./core/utils/general");
const appConfig = require("./app_config");


// Storage Configuration
const accountId = process.env.STORAGE_USER_ID;
const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
const bucketName = process.env.STORAGE_BUCKET_NAME || "teatromusicadosp";
const regionData = process.env.STORAGE_REGION || 'auto'; // Cloudflare R2 uses 'auto'
const endpointURL = process.env.STORAGE_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;
const customDomainURL = process.env.STORAGE_CUSTOM_URL || `${endpointURL}/${bucketName}`;

const s3Client = new S3Client({
  region: regionData,
  endpoint: endpointURL,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

module.exports.bucketName = bucketName;

// Util functions
module.exports.checkRemoteExistence = async (fileName) => {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: bucketName,
      Key: `${fileName}.jpg`,
    }));
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    console.error("[UPLOAD checkRemoteExistence]", error);
    return false;
  }
};

module.exports.checkLocalExistence = async (fileName) => {
  const checkLocalExistence = general.middlewareToPromise(fs.access);

  try {
    await checkLocalExistence(`./temp_uploads/${fileName}.jpg`, fs.constants.F_OK);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") throw Error("ERR_NOT_FOUND");
    throw error;
  }
};

module.exports.getRemoteUrl = (fileName) => {
	console.log("Getting remote URL for:", fileName);
	const url = `${customDomainURL}/${fileName}.jpg`;
	console.log("Generated remote URL:", url);
	return url;
};

module.exports.getLocalUrl = (fileName) => {
  const url = `${appConfig.getWebsiteURL()}${appConfig.server.path}/resource/${fileName}.jpg`;
  console.log("Generated local URL:", url);
  return url; 
};

// File upload
module.exports.remote = async (file) => {
  try {
    const fileStream = fs.createReadStream(`./temp_uploads/${file.fileName}.jpg`);
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: `${file.fileName}.jpg`,
      Body: fileStream,
      ContentType: file.contentType,
      // Note: Cloudflare R2 does not support gzip compression directly in upload; handle if needed
    }));
  } catch (error) {
    console.error("STORAGE ERROR:", error);
  }
};

module.exports.makePublicRemote = async (fileName) => {
  try {
    await s3Client.send(new PutObjectAclCommand({
      Bucket: bucketName,
      Key: {fileName: `${fileName}.jpg`},
      ACL: 'public-read',
    }));
  } catch (error) {
    console.error("STORAGE ACL ERROR:", error);
  }
};

module.exports.makePrivateRemote = async (fileName) => {
  try {
    await s3Client.send(new PutObjectAclCommand({
      Bucket: bucketName,
      Key: {fileName: `${fileName}.jpg`},
      ACL: 'private',
    }));
  } catch (error) {
    console.error("STORAGE ACL ERROR:", error);
  }
};

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