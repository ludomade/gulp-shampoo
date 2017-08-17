"use strict";


function buildLookup(objectArray, propertyName) {
	var lookup = { };

	for (var i = 0; i < objectArray.length; i++) {
		lookup[objectArray[i][propertyName]] = objectArray[i];
	}

	return lookup;
}


module.exports = buildLookup;
