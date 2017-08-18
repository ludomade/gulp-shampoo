"use strict";


const fs = require("fs");
const mkdirp = require("mkdirp");
const { dirname } = require("path");


function doNothing(_) { }


function writeFiles(writes, progressCallbacks = null) {
  const beforeWrite = (progressCallbacks || { }).beforeWrite || doNothing;
  const afterWrite = (progressCallbacks || { }).afterWrite || doNothing;

  let index = 0;

  return new Promise((resolve, reject) => {
    function next() {
      if (index >= writes.length) {
        resolve();
        return;
      }

      const { path, content } = writes[index++];
      mkdirp(dirname(path), (mkdirpError) => {
        if (mkdirpError) {
          reject(mkdirpError);
          return;
        }

        beforeWrite(path);
        fs.writeFile(
          path,
          content,
          { encoding: "utf8" },
          (writeError) => {
            if (writeError) {
              reject(writeError);
              return;
            }
            afterWrite(path);
            next();
          }
        );
      });
    }

    next();
  });
}


module.exports = writeFiles;
