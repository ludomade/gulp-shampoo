var gutil = require("gulp-util");
var inquirer = require("inquirer");
var open = require("open");
var googleLib = require('googleapis');
var fs = require("fs");

module.exports = {

	taskCallback: null,
	oauth2Client: null,
	configFilename: "",
	pluginName: "gulp-shampoo",
	error: null,	//a function for logging an error
	log: null,		//a function for logging to console

	config: {
		google: {
			clientId: "",
			clientSecret: "", //this should be set by the .shampoo file overrides.
			redirectUrl: "http://shampoo.io/oauth2callback",
			scopes: [
				"https://www.googleapis.com/auth/drive.file"
			],
			tokens: {
				accessToken: "", //this should be set by the .shampoo file overrides.
				refreshToken: "" //this should be set by the .shampoo file overrides.
			}
		}
	},

	init: function(params) {

		this.configFilename = __dirname + "/../.shampoo";

		//requires all these items in its "constructor".
		this.taskCallback = params.taskCallback;
		this.log = params.log;
		this.error = params.error;

		this.testConfig(params.ready);

	},

	getAccessToken: function(callback) {

		// generate consent page url
		var self = this;
		var url = this.oauth2Client.generateAuthUrl({
			access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
			scope: this.config.google.scopes, // If you only need one scope you can pass it as string
			approval_prompt: 'force' // re-prompt the user for consent in order to obtain another refresh token.
		});


		this.log('We\'ve opened a browser window. Please authorize the google permissions request to connect to shampoo.');

		open(url);
		inquirer.prompt([{name: "oauthCode", message:"After authorized, enter the code supplied from your browser:\n"}], function(response) {

			//callback(false);
			self.oauth2Client.getToken(response.oauthCode, function(err, tokens) {
				callback(err,tokens);
			});

		});

	},

	logout: function() {

		this.config.google.tokens.accessToken = "";
		this.writeShampooConfig();

	},

	testConfig: function(ready) {

		//test off your configuration file (if it exists)
		//merges your config file into this file's config object.
		var self = this;

		try {
		    fs.accessSync(this.configFilename, fs.F_OK);

			//var jsonOpts = this.grunt.file.readJSON(".shampoo");
			var jsonOpts = require(this.configFilename);

			if(typeof jsonOpts.google != "undefined") {

				if(typeof jsonOpts.google.clientId != "undefined") {
					this.config.google.clientId = jsonOpts.google.clientId;
				}
				if(typeof jsonOpts.google.clientSecret != "undefined") {
					this.config.google.clientSecret = jsonOpts.google.clientSecret;
				}

				if(typeof jsonOpts.google.tokens != "undefined") {

					if(typeof jsonOpts.google.tokens.accessToken != "undefined") {
						this.config.google.tokens.accessToken = jsonOpts.google.tokens.accessToken;
					}
					if(typeof jsonOpts.google.tokens.refreshToken != "undefined") {
						this.config.google.tokens.refreshToken = jsonOpts.google.tokens.refreshToken;
					}

				}
			}

			if(!this.config.google.clientId.length) {
				this.error("Google clientId wasn't specified.  Please add a value to the key google.clientId in your .shampoo file.");
				this.taskCallback(true);
				return;
			}

			if(!this.config.google.clientSecret.length) {
				this.error("Google clientSecret wasn't specified.  Please add a value to the key google.clientSecret in your .shampoo file.");
				this.taskCallback(true);
				return;
			}

			ready();

		} catch (e) {

		    //silent fail

			//no .shampoo file exists - lets help the user set it up.
			inquirer.prompt([{name: "clientId", message:"Please enter your google ClientID.  If you don't know what this is, ask a Shampoo Admin.\n"}, {name: "clientSecret", message: "Please enter your google ClientSecret.  If you don't know what this is, ask a Shampoo Admin."}], function(response) {

				self.config.google.clientId = response.clientId;
				self.config.google.clientSecret = response.clientSecret;

				ready();

			});


		}

	},

	request: function(callBack) {

		var self = this;
		var OAuth2 = googleLib.auth.OAuth2;

		this.oauth2Client = new OAuth2(this.config.google.clientId, this.config.google.clientSecret, this.config.google.redirectUrl);
		googleLib.options({ auth: this.oauth2Client });

		if(this.config.google.tokens.refreshToken.length && this.config.google.tokens.accessToken.length) {

			//if we've saved down the access token in the .shampoo file
			this.oauth2Client.setCredentials({
				access_token: this.config.google.tokens.accessToken,
				refresh_token: this.config.google.tokens.refreshToken
			});

			this.oauth2Client.refreshAccessToken(function(err, tokens) {

				// your access_token is now refreshed and stored in oauth2Client
				var error = false;

			  	if(tokens == null) {

					self.error("Shampoo error: There was an error contacting the google auth.  We couldn't refresh your access token.  Sorry.  Please Try again." + JSON.stringify(err));

			  		self.taskCallback(true);

			  	} else {

			  		self.config.google.tokens.accessToken = tokens.access_token;
			  		if(typeof tokens.refresh_token != "undefined") {
			  			if(tokens.refresh_token != self.config.refreshToken) {
			  				self.config.google.tokens.refreshToken = tokens.refresh_token;
			  			}
			  			self.config.google.tokens.accessToken = tokens.access_token;
			  		}
			  		self.writeShampooConfig();

			  		callBack();

			  	}
			});




		} else {

			//if auth hasn't been saved - or an error occured previously
			this.getAccessToken(function(err,tokens) {

				if(err) {

					self.error("Shampoo error: There was an error contacting the google auth.  Try again.");
					//reset the tokens in the shampoo file.
					self.config.google.tokens.accessToken = "";
					//self.config.google.tokens.refreshToken = "";

				} else {

					//write the auth token and refresh token out to the .shampoo file
					self.log("Got your google access token, thanks.  Saving it down to your .shampoo file.");

					self.config.google.tokens.accessToken = tokens.access_token;
					if(typeof tokens.refresh_token != "undefined") {
						self.config.google.tokens.refreshToken = tokens.refresh_token;
					}

					self.oauth2Client.setCredentials(tokens);
				}

				self.writeShampooConfig();

				if(err) {

					//tell grunt to fail
					self.taskCallback(true);

				} else {

					//fire the this modules callback
					callBack();

				}

			});

		}

	},

	writeShampooConfig: function() {

		var self = this;
		var output = "module.exports = " + JSON.stringify(this.config, undefined, 4);
		fs.writeFile(this.configFilename, output, function(err) {
			if(err) {
				self.error("There was an error writing your shampoo config.  The error was:" + err);
			}
		});

	}

}
