'use strict';

require('raptor-polyfill');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');
var replace = require('../transform-util').replace;


function checkRequireEbayApi(n) {
    if(!n) {
        return false;
    }
    if(n.type === 'CallExpression' && n.callee && n.callee.name === 'require' && n.arguments && n.arguments[0] && n.arguments[0].value && n.arguments[0].value.indexOf('ebay-api/') > -1 ) {
        return true;
    }

    return false;
}

function transformRequireEbayApi(n, parent, options, moduleOpt) {
    if( !checkRequireEbayApi(n) ) {
        return;
    }
    console.log(n);
    var ea = n.arguments[0].value;
    var arr = ea.split('/');
    ea = moduleOpt.srcRelative +'src/' + ea + '/' + arr[1];
    var arg = n.arguments[0];
    arg.value = ea;
    delete arg.raw;

}

function transformAST(ast, options, moduleOptions) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {},

        leave: function(node, parent) {

            transformRequireEbayApi(node, parent, options, moduleOptions);


        }

    });

    return ast;
}

exports.transformAST = transformAST;
