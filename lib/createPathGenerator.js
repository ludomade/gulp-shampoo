"use strict";


const path = require("path");


const ASTERISKS = /\*/g;
function createNamerByTemplate(template) {
  if (template.indexOf("*") === -1) {
    throw new Error("Output path pattern must contain a * character.");
  }

  return (document) => template.replace(ASTERISKS, document.locale.code);
}


function createPathGenerator(pathParam, legacyDirParam, defaultSuffix) {
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


module.exports = createPathGenerator;
