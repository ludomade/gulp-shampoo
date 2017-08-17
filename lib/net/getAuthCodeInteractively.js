"use strict";


const inquirer = require("inquirer");
const opn = require("opn");


function getAuthCodeInteractively(url, callback) {
  opn(url, { wait: false });

  inquirer.prompt(
    [
      {
        name: "authCode",
        message:
          "Use the opened browser window to authorize access to your Shampoo document.\n" +
          "  " + url + "\n\n" +
          "Once authorized, copy and paste the code here and press enter.\n"
      }
    ],

    ({ authCode }) => {
      callback(null, authCode);
    }
  );
}


module.exports = getAuthCodeInteractively;
