"use strict";


const googleapis = require("googleapis");
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


function updateState(storage, state, patch, callback) {
  const newState = Object.assign({ }, state, patch);
  storage.setState(newState, callback);
}


function refreshTokens(auth, storage, state, logger, callback) {
  logger.debug("refreshTokens");
  auth.refreshAccessToken((refreshError, tokens) => {
    if (refreshError) {
      return callback(refreshError);
    }

    updateState(storage, state, getTokensFromResponse(tokens), callback);
  });
}


function newAuthorization(auth, authorizeFunc, storage, state, logger, callback) {
  const authUrl = auth.generateAuthUrl({
    access_type: "offline",
    scope: [ DRIVE_FILE_SCOPE ],
    approval_prompt: "force"
  });

  logger.debug(`newAuthorization: authUrl=${authUrl}`);
  authorizeFunc(authUrl, (authError, authCode) => {
    if (authError) {
      return callback(authError);
    }

    auth.getToken(authCode, (tokenError, response) => {
      if (tokenError) {
        logger.debug("newAuthorization: getToken failed. Clearing tokens from storage");
        const clearPatch = {
          access_token: null,
          refresh_token: null
        };

        updateState(storage, state, clearPatch, (updateError) => {
          callback(updateError || tokenError);
        });
      } else {
        const tokens = getTokensFromResponse(response);
        auth.setCredentials(tokens);
        updateState(storage, state, tokens, callback);
      }
    });
  });
}


function prepareAuth(storage, authorizeFunc, logger, callback) {
  storage.getState((getStateError, state) => {
    if (getStateError) {
      return callback(stateError);
    }

    const { clientId, clientSecret } = state;

    if (!clientId) {
      return callback(new Error("Client ID not specified"));
    }

    if (!clientSecret) {
      return callback(new Error("Client secret not specified"));
    }

    const auth = new googleapis.auth.OAuth2(clientId, clientSecret, REDIRECT_URL);
    const { access_token, refresh_token } = state;

    if (access_token && refresh_token) {
      logger.debug("prepareAuth: got access_token and refresh_token from storage");
      auth.setCredentials({ access_token, refresh_token });
      refreshTokens(auth, storage, state, logger, (refreshError) => {
        if (refreshError) {
          callback(refreshError);
        } else {
          callback(null, auth);
        }
      });

    } else {
      logger.debug("prepareAuth: either access_token or refresh_token missing from storage");
      newAuthorization(auth, authorizeFunc, storage, state, logger, (newAuthError) => {
        if (newAuthError) {
          callback(newAuthError);
        } else {
          callback(null, auth);
        }
      });
    }
  });
}


module.exports = prepareAuth;
