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


const hasOwn = Object.prototype.hasOwnProperty;
function getOwn(object, key, defaultValue) {
  return hasOwn.call(object, key) ? object[key] : defaultValue;
}


function castToArray(thing) {
  if (thing == null) {
    return [ ];
  }

  if (Array.isArray(thing)) {
    return thing;
  }

  return [ thing ];
}


function castToKeyFunc(key) {
  if (typeof key === "function") {
    return key;
  }

  return (v) => v[key];
}


function buildLookup(objectArray, propertyNameOrKeyFunc) {
  const lookup = { };

  const keyFunc = castToKeyFunc(propertyNameOrKeyFunc);

  for (let i = 0; i < objectArray.length; i++) {
    lookup[keyFunc(objectArray[i])] = objectArray[i];
  }

  return lookup;
}


module.exports = {
  isPrimitiveValue,
  keyIn,
  getOwn,
  castToArray,
  buildLookup
};
