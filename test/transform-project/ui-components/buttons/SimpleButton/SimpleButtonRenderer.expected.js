var templating = require('raptor-templates');
module.exports = {
    render: function (input, context) {
        templating.render('ui-components/buttons/SimpleButton', { label: input.label }, context);
    }
};