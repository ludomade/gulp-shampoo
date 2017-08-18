/*
 * shampoo
 *
 * Copyright (c) 2017 Ludomade
 * Licensed under the MIT license.
 */
"use strict";


const createPathGenerator = require("./lib/createPathGenerator");
const getAuthCodeInteractively = require("./lib/net/getAuthCodeInteractively");
const getCredentialsInteractively = require("./lib/net/getCredentialsInteractively");
const googleapis = require("googleapis");
const parseDocument = require("./lib/doc/parseDocument");
const prepareAuth = require("./lib/net/prepareAuth");
const promisify = require("./lib/promisify").scalar;
const writeFiles = require("./lib/writeFiles");
const { FileStorage } = require("./lib/net/storage");
const { buildLookup, castToArray } = require("./lib/langutil");
const { defaultLogger } = require("./lib/log");
const { formatLocaleArray } = require("./lib/messaging");


function fetchSource(params) {
  const logger = params.logger || defaultLogger;

  const fileId = params.documentId;
  logger.debug(`fileId=${fileId}`);

  const configPath = params.configPath || ".shampoo";
  logger.debug(`configPath=${configPath}`);

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
    });
}


function fetch(params) {
  const logger = params.logger || defaultLogger;

  return fetchSource(params)
    .then((realtimeDocument) => {
      const result = parseDocument(realtimeDocument);
      for (const message of result.messages) {
        logger.warn(message);
      }

      return result;
    });
}


const hasOwn = Object.prototype.hasOwnProperty;
function pickLocalesByCode(allDocuments, selectedLocales) {
  if (selectedLocales == null) {
    return {
      documents: allDocuments,
      unknownLocales: [ ]
    };
  }

  const byCode = buildLookup(allDocuments, (d) => d.locale.code);
  const documents = [ ];
  const unknownLocales = [ ];

  for (const localeCode of castToArray(selectedLocales)) {
    if (hasOwn.call(byCode, localeCode)) {
      documents.push(byCode[localeCode]);
    } else {
      unknownLocales.push(localeCode);
    }
  }

  return { documents, unknownLocales };
}


function downloadSplitLocales(params) {
  const logger = params.logger || defaultLogger;
  const locales = params.activeLocales;
  const namer = createPathGenerator(params.outputPath, params.outputDir, ".json");

  return fetch(params)
    .then((result) => {
      const { documents, unknownLocales } = pickLocalesByCode(result.documents, locales);

      for (const unknownLocaleCode of unknownLocales) {
        logger.warn(`No locale with code '${unknownLocaleCode}'`);
      }

      if (unknownLocales.length > 0) {
        logger.info(
          "Available locales: " +
          formatLocaleArray(result.documents.map((d) => d.locale))
        );
      }

      if (documents.length === 0) {
        logger.warn("No valid locales specified. No files will be written.");
      }

      const writes = documents.map(
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


module.exports = { fetchSource, fetch, downloadSplitLocales };
