var extend = require('raptor').extend;
var raptor = require('raptor');
raptor.forEachEntry({});
raptor.createError(new Error('test'));
throw raptor.createError(new Error('The "name" or "name-from-attribute" attribute is required for a nested variable'));
