
// exports.addRoutes = function(app, env) {
//     app.get('/cln/_mycollections', require('./src/pages/my-collections'));
//     app.get('/cln/@@__@@__@@', require('./src/pages/my-collections'));
//     /*app.all('/cln/giftingcollections', require('./src/pages/gifting'));*/
//     app.all('/giftingcollections', require('./src/pages/gifting'));
//     app.get('/cln/explorer/_ajax', require('./src/pages/explorer-ajax-more-collection'));
//     app.get('/cln', require('./src/pages/explorer'));
//     app.all('/cln/_ajax/:page/:owner/:collectionId', require('./src/pages/ajax'));
//     app.all('/test', require('./src/pages/test'));
//     app.get('/cln/:username/:collectionName/:collectionId', require('./src/pages/collection'));
//     app.get('/cln/:username//:collectionId', require('./src/pages/collection'));
//     app.get('/cln/:username', require('./src/pages/collections'));
//     // hack to get something to show up for Validate Internals
//     app.get('/admin/v6console/ValidateInternals', require('./src/pages/validate-internals'));
//     //app.get('/admin/v3console/*', require('./src/pages/view-config-category-xml'));
//     //app.get('/cln/explorer', require('./src/pages/explorer'));
// };

module.exports = function(app) {
    app.get('/', require('./src/pages/raptor'));
    app.get('/cln/:username/:collectionName/:collectionId', require('./src/pages/collection'));
};
