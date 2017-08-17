"use strict";


const fs = require("fs");
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

  getState(callback) {
    this._logger.debug("FileStorage.getState: readFile");
    fs.readFile(this._path, { encoding: "utf8" }, (readError, content) => {
      if (readError) {
        this._logger.debug(`FileStorage.getState: readError=${readError}`);
      }

      let parseError = null;
      let state = null;

      if (!readError) {
        try {
          state = parseState(content);
        } catch (_parseError) {
          parseError = _parseError;
          this._logger.debug(`FileStorage.getState: parseError=${parseError}`);
        }
      }

      if (readError || parseError) {
        this._logger.debug("FileStorage.getState: Failed to read state file.");
        if (this._interactiveDelegate) {
          this._logger.debug("FileStorage.getState: Starting interactiveDelegate");
          return this._interactiveDelegate(callback);
        }
        this._logger.debug("FileStorage.getState: No interactiveDelegate");
        return callback(readError || parseError);
      }

      callback(null, state);
    });
  }

  setState(newState, callback) {
    this._logger.debug("FileStorage.setState: writeFile");
    fs.writeFile(
      this._path,
      formatState(newState),
      {
        encoding: "utf8",
        mode: 0o600
      },
      callback
    );
  }
}


module.exports = { FileStorage };
