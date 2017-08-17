/*
 * shampoo
 *
 * Copyright (c) 2017 Ludomade
 * Licensed under the MIT license.
 */
"use strict";


const getAuthCodeInteractively = require("./lib/net/getAuthCodeInteractively");
const getCredentialsInteractively = require("./lib/net/getCredentialsInteractively");
const googleapis = require("googleapis");
const parseDocument = require("./lib/doc/parseDocument");
const path = require("path");
const prepareAuth = require("./lib/net/prepareAuth");
const promisify = require("./lib/promisify").scalar;
const writeFiles = require("./lib/writeFiles");
const { FileStorage } = require("./lib/net/storage");
const { defaultLogger } = require("./lib/log");


function download(params) {
  const logger = params.logger || defaultLogger;

  const fileId = params.documentId;
  logger.debug(`fileId=${fileId}`);

  const configPath = params.configPath || ".shampoo";
  logger.debug(`configPath=${configPath}`);

  const requestedLocales = params.activeLocales || null;
  logger.debug(`requestedLocales=${requestedLocales}`);

  const allowInteractive = params.allowInteractive !== false;
  logger.debug(`allowInteractive=${allowInteractive}`);

  if (!fileId) {
    return Promise.reject(new Error("Missing required parameter documentId"));
  }

  const storage = new FileStorage(
    configPath,
    allowInteractive ? getCredentialsInteractively : null,
    logger
  );

  return prepareAuth(storage, getAuthCodeInteractively, logger)
    .then((auth) => {
      const drive = googleapis.drive({ version: "v2", auth });
      const realtimeGet = promisify(drive.realtime.get, drive.realtime);

      return realtimeGet({ fileId });
    })
    .then((realtimeDocument) => {
      const result = parseDocument(realtimeDocument, requestedLocales);
      for (const message of result.messages) {
        logger.warn(message);
      }

      return result;
    });
}


const ASTERISKS = /\*/g;
function createNamerByTemplate(template) {
  if (template.indexOf("*") === -1) {
    throw new Error("Output path pattern must contain a * character.");
  }

  return (document) => template.replace(ASTERISKS, document.locale.code);
}


function createNamer(pathParam, legacyDirParam, defaultSuffix) {
  if (pathParam) {
    if (typeof pathParam === "function") {
      return pathParam;
    }
    return createNamerByTemplate(String(pathParam));
  }

  if (legacyDirParam) {
    return (document) => path.join(legacyDirParam, document.locale.code + defaultSuffix);
  }

  return (document) => document.locale.code + defaultSuffix;
}


function downloadAndSavePerLocale(params) {
  const logger = params.logger || defaultLogger;
  const namer = createNamer(params.outputPath, params.outputDir, ".json");

  return download(params)
    .then((result) => {
      const writes = result.documents.map(
        (document) => ({
          path: namer(document),
          content: JSON.stringify(document.values, null, 2)
        })
      );

      return writeFiles(
        writes,
        {
          beforeWrite: (path) => {
            logger.info(`Writing ${path}`);
          }
        }
      );
    });
}


module.exports = { download, downloadAndSavePerLocale };
