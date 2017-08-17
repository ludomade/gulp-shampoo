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
const writeFiles = require("./lib/writeFiles");
const { FileStorage } = require("./lib/net/storage");
const { defaultLogger } = require("./lib/log");


function download(params, callback) {
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
    process.nextTick(() => {
      callback(new Error("Missing required parameter documentId"));
    });
  }

  const storage = new FileStorage(
    configPath,
    allowInteractive ? getCredentialsInteractively : null,
    logger
  );

  prepareAuth(storage, getAuthCodeInteractively, logger, (authError, auth) => {
    if (authError) {
      return callback(authError);
    }

    googleapis.options({ auth });
    googleapis.drive({ version: "v2", auth })
      .realtime.get({ fileId }, (gdriveError, realtimeDocument) => {
        if (gdriveError) {
          return callback(gdriveError);
        }

        let result;
        try {
          result = parseDocument(realtimeDocument, requestedLocales);
          for (const message of result.messages) {
            logger.warn(message);
          }
        } catch (parseError) {
          return callback(parseError);
        }

        callback(null, result);
      });
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


function downloadAndSavePerLocale(params, callback) {
  const logger = params.logger || defaultLogger;
  const namer = createNamer(params.outputPath, params.outputDir, ".json");

  download(params, (downloadError, result) => {
    if (downloadError) {
      return callback(downloadError);
    }

    const writes = result.documents.map(
      (document) => ({
        path: namer(document),
        content: JSON.stringify(document.values, null, 2)
      })
    );

    writeFiles(
      writes,
      {
        beforeWrite: (path) => {
          logger.info(`Writing ${path}`);
        }
      },
      callback
    );
  });
}


module.exports = { download, downloadAndSavePerLocale };
