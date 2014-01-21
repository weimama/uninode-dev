var promises = require('raptor-promises');

require('raptor-util').extend(require('./index_async'), {
    renderToStringAsync: function(templateName, data, context) {},
    renderAsync: function(templateName, data, context) {}
});