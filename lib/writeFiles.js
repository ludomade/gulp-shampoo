"use strict";


const fs = require("fs");
const mkdirp = require("mkdirp");
const { dirname } = require("path");


function doNothing(_) { }


function writeFiles(writes, ...params) {
  let progressCallbacks = { };
  let terminalCallback;

  switch (params.length) {
  case 0:
    break;
  case 1:
    terminalCallback = params[0];
    break;
  default:
    progressCallbacks = params[0];
    terminalCallback = params[1];
    break;
  }

  const beforeWrite = progressCallbacks.beforeWrite || doNothing;
  const afterWrite = progressCallbacks.afterWrite || doNothing;

  let index = 0;

  function next() {
    if (index >= writes.length) {
      return terminalCallback(null);
    }

    const { path, content } = writes[index++];
    mkdirp(dirname(path), (mkdirpError) => {
      if (mkdirpError) {
        return terminalCallback(mkdirpError);
      }

      beforeWrite(path);
      fs.writeFile(
        path,
        content,
        { encoding: "utf8" },
        (writeError) => {
          if (writeError) {
            return terminalCallback(writeError);
          }
          afterWrite(path);
          next();
        }
      );
    });
  }

  process.nextTick(next);
}


module.exports = writeFiles;
