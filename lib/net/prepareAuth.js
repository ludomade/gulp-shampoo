"use strict";


const googleapis = require("googleapis");
const promisify = require("../promisify").scalar;
const { defaultLogger } = require("../log");


const REDIRECT_URL = "http://shampoo.ludomade.com/oauth2callback";
const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";


function getTokensFromResponse(response) {
  const tokens = {
    access_token: response.access_token
  };

  if (response.refresh_token) {
    tokens.refresh_token = response.refresh_token;
  }

  return response;
}


class AuthBuilder {
  constructor(storage, authorizeFunc, logger) {
    this.storage = storage;
    this.authorizeFunc = authorizeFunc;
    this.logger = logger;

    this._state = null;
    this._auth = null;
  }

  build() {
    return this.storage.getState()
      .then((state) => {
        this._state = state;
        return this._initAuth()
          .then(() => this._auth);
      });
  }

  _initAuth() {
    const { clientId, clientSecret } = this._state;

    if (!clientId) {
      throw new Error("Client ID not specified");
    }

    if (!clientSecret) {
      throw new Error("Client secret not specified");
    }

    this._auth = new googleapis.auth.OAuth2(clientId, clientSecret, REDIRECT_URL);
    const { access_token, refresh_token } = this._state;

    if (access_token && refresh_token) {
      return this._refreshTokens();
    } else {
      return this._newAuthorization();
    }
  }

  _refreshTokens() {
    const { access_token, refresh_token } = this._state;
    this.logger.debug("_refreshTokens");
    this._auth.setCredentials({ access_token, refresh_token });

    const refreshAccessToken = promisify(this._auth.refreshAccessToken, this._auth);

    return refreshAccessToken()
      .then((tokens) => this._updateState(getTokensFromResponse(tokens)));
  }

  _newAuthorization() {
    const authUrl = this._auth.generateAuthUrl({
      access_type: "offline",
      scope: [ DRIVE_FILE_SCOPE ],
      approval_prompt: "force"
    });

    this._logger.debug(`_newAuthorization: authUrl=${authUrl}`);

    const getToken = promisify(this._auth.getToken, this._auth);

    return this.authorizeFunc(authUrl)
      .then((authCode) => getToken(authCode))
      .then((response) => {
        const tokens = getTokensFromResponse(response);
        this._auth.setCredentials(tokens);
        return this._updateState(storage, state, tokens);
      })
      .catch((error) => {
        logger.debug("_newAuthorization: getToken failed. Clearing tokens from storage");
        const clearPatch = {
          access_token: null,
          refresh_token: null
        };

        return this._updateState(storage, state, clearPatch)
          .then(() => { throw error; });
      });
  }

  _updateState(patch) {
    this._state = Object.assign({ }, this._state, patch);
    return this.storage.setState(this._state);
  }
}


function prepareAuth(storage, authorizeFunc, logger) {
  return new AuthBuilder(storage, authorizeFunc, logger).build();
}


module.exports = prepareAuth;
