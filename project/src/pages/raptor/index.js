var template = require('raptor-templates').load(require.resolve('./template.rhtml'));

module.exports = function(req, res) {
     res.setHeader('Content-Type', 'text/html; charset=utf-8');
     console.log('params:', req.params);
     var viewModel = {name: 'ebay'};
     viewModel.asyncname = function(args, callback) {
         return callback(null, 'ASYNC-HELLO2');
     };
     viewModel.pagename = require('commons-ebay').getPageName();

     template.render(viewModel, res);
};

// var express = require('express');
// var app = express();
// app.use(function(req, res, next) {
//     res.setHeader('Content-Type', 'text/html; charset=utf-8');
//     console.log('params:', req.params);
//     var viewModel = {name: 'ebay'};
//     viewModel.asyncname = function(args, callback) {
//         return callback(null, 'ASYNC-HELLO2');
//     };
//     viewModel.pagename = require('commons-ebay').getPageName();
//
//     template.render(viewModel, res);
// });
// module.exports = app;
