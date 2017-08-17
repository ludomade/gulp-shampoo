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
        return resolve();
      }

      const { path, content } = writes[index++];
      mkdirp(dirname(path), (mkdirpError) => {
        if (mkdirpError) {
          return reject(mkdirpError);
        }

        beforeWrite(path);
        fs.writeFile(
          path,
          content,
          { encoding: "utf8" },
          (writeError) => {
            if (writeError) {
              return reject(writeError);
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
