"use strict";


function corePromisify(userFunc, instance, isScalar) {
  const func = instance ? userFunc.bind(instance) : userFunc;

  return function (...args) {
    return new Promise((resolve, reject) => {
      func(
        ...args,
        (error, ...result) => {
          if (error) {
            reject(error);
          } else {
            resolve(isScalar ? result[0] : result);
          }
        }
      )
    });
  }
}


function vector(userFunc, instance = null) {
  return corePromisify(userFunc, instance, false);
}


function scalar(userFunc, instance = null) {
  return corePromisify(userFunc, instance, true);
}


module.exports = { vector, scalar };
