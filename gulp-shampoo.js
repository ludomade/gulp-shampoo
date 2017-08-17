"use strict";


const gulpUtil = require("gulp-util");
const { downloadAndSavePerLocale } = require("./shampoo");


function pluginError(message) {
  return new gulpUtil.PluginError({
    plugin: "gulp-shampoo",
    message
  });
}


const GULP_LOGGER = {
  debug(message) { },
  verbose(message) { },
  info(message) { gulpUtil.log(message); },
  warn(message) { gulpUtil.log(gulpUtil.colors.yellow(message)); },
  error(message) { gulpUtil.log(gulpUtil.colors.red(message)); },
  prompt(message) { gulpUtil.log(gulpUtil.colors.bold(message)); }
};


const GULP_DEFAULTS = {
  logger: GULP_LOGGER,
  outputDir: "locales/"
};


function gulpShampooDownload(userParams, callback) {
  const params = Object.assign({ }, GULP_DEFAULTS, userParams);

  if (!params.documentId) {
    throw pluginError("No documentId set");
  }

  downloadAndSavePerLocale(params)
    .then(callback)
    .catch((error) => {
      throw pluginError(error);
    });
}


module.exports = { gulpShampooDownload };
