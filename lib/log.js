"use strict";


const defaultLogger = {
  debug(message) { },
  verbose(message) { },
  info(message) { console.log(message); },
  warn(message) { console.warn(message); },
  error(message) { console.error(message); },
  prompt(message) { console.log(message); }
};


const nullLogger = {
  debug(message) { },
  verbose(message) { },
  info(message) { },
  warn(message) { },
  error(message) { },
  prompt(message) { }
};


module.exports = { defaultLogger, nullLogger };
