"use strict";


const inquirer = require("inquirer");


function getCredentialsInteractively() {
  return inquirer.prompt(
    [
      {
        name: "clientId",
        message: "Please enter your Google client ID.\n"
      },
      {
        name: "clientSecret",
        message: "Please enter your Google client secret.\n",
        type: "password"
      }
    ]
  );
}


module.exports = getCredentialsInteractively;
