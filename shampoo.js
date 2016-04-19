/*
 * grunt-shampoo
 * https://github.com/ludomade/grunt-shampoo
 *
 * Copyright (c) 2015 Ludomade
 * Licensed under the MIT license.
 */

'use strict';

var auth = require('./lib/googleAuth');
var transformer = require('./lib/documentTransformer');
var gutil = require('gulp-util');
var _ = require('underscore');
var mkdirp = require('mkdirp');
var fs = require('fs');
var getDirName = require('path').dirname;

function log(message) {

	gutil.log(message);

}

function error(message) {

	throw new gutil.PluginError({
		plugin: "gulp-shampoo",
		message: message
	});
	return;

}

function writeFile(outputFile, doc) {
	mkdirp(getDirName(outputFile), function (err) {

		if (err) {
			error("There was an error writing your shampoo locale.  The error was:" + err);
		}

		fs.writeFile(outputFile, JSON.stringify(doc.data, undefined, 4), function(err) {
			if(err) {
				error("There was an error writing your shampoo locale.  The error was:" + err);
			}
			log("Writing " + outputFile);
		});

	});
}

module.exports = function(params, callback) {

	// if(!grunt.file.exists(".shampoo")) {
	// 	grunt.log.error("No .shampoo configuration file was found.  Please create one.  See the readme (https://github.com/ludomade/grunt-shampoo/tree/shampoo3) for more info.");
	// 	done(false);
	// 	return;
	// }

	// Merge task-specific and/or target-specific options with these defaults.
	var defaults = {
		documentId: "",
		outputDir: "locales/",
		activeLocales: []
	};

	var options = _.extend(defaults, params);

	if(!options.documentId.length) {
		error("No shampoo documentId was set as an option on the Grunt task.  Add `{documentId:\"MyDocumentId\"}` to the gulp task configuration!");
		return;
	}

	if (options.activeLocales.length === 0) {
		error("No active locales has been set.  Add `{activeLocales:\"MyDocumentId\"}` to the gulp task configuration!");
		return;
	}

	if(options.outputDir.charAt(options.outputDir.length - 1) !== "/") {
		//if the output dir's last character isn't "/", tack it on
		options.outputDir += "/";
	}

	auth.init({
		taskCallback: callback,
		log: log,
		error: error,
		ready: function() {

			auth.request(function() {

				//this only gets called when there was a success grabbing down an API key.

				//transform the native google doc data into an array of json documents.
				transformer.init({
					taskCallback: callback,
					options: options,
					auth: auth,
					log: log,
					error: error
				});

				transformer.fetch(function(jsonDocuments) {

					for(var i=0; i<jsonDocuments.length; i++) {
						//write out the json document!
						var doc = jsonDocuments[i];
						var outputFile = options.outputDir + doc.locale + ".json";
						writeFile(outputFile, doc);

					}

					callback(false);

				});

			});

		}
	});

};
