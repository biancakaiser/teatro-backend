/* eslint-disable indent */
/* eslint-disable linebreak-style */
const moment = require("moment-timezone");
const crypto = require("crypto");
const Joi = require("joi");

// const JoiEntityId = Joi.string().min(1).max(16);
const JoiEntityId = Joi.number();

// ///////////////////////////////////////////////////////////////////////////////////////////
// DateTime handling

function makeDateTime(dateText) {
  return moment(dateText).tz("America/Sao_Paulo").milliseconds(0).toDate();
}

// ///////////////////////////////////////////////////////////////////////////////////////////
// Promise auxiliary functions
async function promiseTimeout(promise, timeoutMs) {
  const timeoutPromise = new Promise((_resolve, reject) => {
    setTimeout(() => reject(Error("TIMEOUT")), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

async function unrejectablePromiseAll(promiseArray) {
  return Promise.all(
    promiseArray.map(promise => promise
      .then(result => ({
        result,
        status: "resolved",
      }))
      .catch(error => ({
        error,
        status: "rejected",
      }))),
  );
}

async function createHash(entropy) {
  const hash = crypto.createHash("sha256");
  hash.update(entropy);
  return (await hash.digest("base64")).replace(/\//g, "_");
}

async function createRandomHash(entropy) {
  return createHash(String(Math.random()) + entropy);
}

function generateId(length) {
  return crypto.randomBytes(length / 2).toString("base64");
}

const middlewareToPromise = middlewareFunction => (req, res) => new Promise((resolve, reject) => {
  middlewareFunction(req, res, (error) => {
    if (error) reject(error);
    resolve([req, res]);
  });
});

module.exports = {
  makeDateTime,
  promiseTimeout,
  unrejectablePromiseAll,
  middlewareToPromise,
  createRandomHash,
  createHash,
  generateId,
  JoiEntityId,
};
