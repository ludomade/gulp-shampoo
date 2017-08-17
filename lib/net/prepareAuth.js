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


function updateState(storage, state, patch) {
  const newState = Object.assign({ }, state, patch);
  return storage.setState(newState);
}


function refreshTokens(auth, storage, state, logger, callback) {
  logger.debug("refreshTokens");

  const refreshAccessToken = promisify(auth.refreshAccessToken, auth);

  return refreshAccessToken()
    .then((tokens) => updateState(storage, state, getTokensFromResponse(tokens)));
}


function newAuthorization(auth, authorizeFunc, storage, state, logger) {
  const authUrl = auth.generateAuthUrl({
    access_type: "offline",
    scope: [ DRIVE_FILE_SCOPE ],
    approval_prompt: "force"
  });

  const getToken = promisify(auth.getToken, auth);

  logger.debug(`newAuthorization: authUrl=${authUrl}`);
  return authorizeFunc(authUrl)
    .then((authCode) => getToken(authCode))
    .then((response) => {
      const tokens = getTokensFromResponse(response);
      auth.setCredentials(tokens);
      return updateState(storage, state, tokens);
    })
    .catch((error) => {
      logger.debug("newAuthorization: getToken failed. Clearing tokens from storage");
      const clearPatch = {
        access_token: null,
        refresh_token: null
      };

      return updateState(storage, state, clearPatch)
        .then(() => { throw error; });
    });
}


function prepareAuth(storage, authorizeFunc, logger) {
  return storage.getState()
    .then((state) => {
      const { clientId, clientSecret } = state;

      if (!clientId) {
        throw new Error("Client ID not specified");
      }

      if (!clientSecret) {
        throw new Error("Client secret not specified");
      }

      const auth = new googleapis.auth.OAuth2(clientId, clientSecret, REDIRECT_URL);
      const { access_token, refresh_token } = state;

      if (access_token && refresh_token) {
        logger.debug("prepareAuth: got access_token and refresh_token from storage");
        auth.setCredentials({ access_token, refresh_token });

        return refreshTokens(auth, storage, state, logger)
          .then(() => auth);

      } else {
        logger.debug("prepareAuth: either access_token or refresh_token missing from storage");

        return newAuthorization(auth, authorizeFunc, storage, state, logger)
          .then(() => auth);
      }
    })
}


module.exports = prepareAuth;
