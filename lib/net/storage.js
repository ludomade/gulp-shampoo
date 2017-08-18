"use strict";


const fsExtra = require("fs-extra");
const { defaultLogger } = require("../log");


function parseState(text) {
  // this is just json with a specific structure and 'module.exports = '
  // prepended. but let's just parse it instead of executing it.

  const opener = text.indexOf("{");
  const closer = text.lastIndexOf("}");

  if (opener >= 0 && closer > opener) {
    const object = JSON.parse(text.substring(opener, closer + 1));

    const google = object.google || { };
    const tokens = google.tokens || { };

    return {
      clientId: google.clientId,
      clientSecret: google.clientSecret,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    };
  }

  throw new Error("Failed to parse state file");
}


function formatState(state) {
  const google = {
    clientId: state.clientId,
    clientSecret: state.clientSecret
  };

  if (state.access_token) {
    const tokens = google.tokens = { };
    tokens.accessToken = state.access_token;
    if (state.refresh_token) {
      tokens.refreshToken = state.refresh_token;
    }
  }

  return "module.exports = " + JSON.stringify({ google }, null, 4);
}


class FileStorage {
  constructor(path, interactiveDelegate, logger) {
    this._path = String(path);
    this._interactiveDelegate = interactiveDelegate || null;
    this._logger = logger || defaultLogger;
  }

  getState() {
    this._logger.debug("FileStorage.getState: readFile");

    return fsExtra.readFile(this._path, { encoding: "utf8" })
      .then((content) => parseState(content))
      .catch((error) => {
        this._logger.debug(`FileStorage.getState: Failed to read state file: ${error}`);
        if (this._interactiveDelegate) {
          this._logger.debug("FileStorage.getState: Starting interactiveDelegate");
          return this._interactiveDelegate();
        }

        this._logger.debug("FileStorage.getState: No interactiveDelegate");
        throw error;
      });
  }

  setState(newState) {
    this._logger.debug("FileStorage.setState: writeFile");
    return fsExtra.writeFile(
      this._path,
      formatState(newState),
      {
        encoding: "utf8",
        mode: 0o600
      }
    );
  }
}


module.exports = { FileStorage };
