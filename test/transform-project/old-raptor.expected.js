var forEachEntry = require('raptor-util').forEachEntry;
var createError = require('raptor-util').createError;
var extend = require('raptor-util').extend;
forEachEntry({});
createError(new Error('test'));
throw createError(new Error('The "name" or "name-from-attribute" attribute is required for a nested variable'));