"use strict";


function isPrimitiveValue(v) {
  if (v == null) {
    return true;
  }

  switch (typeof v) {
  case "boolean":
  case "string":
  case "number":
  case "symbol":
    return true;
  }

  return false;
}


function keyIn(object, key) {
  return isPrimitiveValue(object) ? false : key in object;
}


var hasOwn = Object.prototype.hasOwnProperty;
function getOwn(object, key, defaultValue) {
  return hasOwn.call(object, key) ? object[key] : defaultValue;
}


module.exports = {
  isPrimitiveValue: isPrimitiveValue,
  keyIn: keyIn,
  getOwn: getOwn
};
