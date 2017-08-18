"use strict";


function formatLocaleArray(array) {
  return array
    .map((locale) => `'${locale.code}'`)
    .join(", ");
}


module.exports = { formatLocaleArray };
