'use strict';

require('raptor-polyfill');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');
var esgraph = require('esgraph');
var u = require('./util.js');
var tu = require('../transform-util.js');

function isAppUse(node) {
    if(node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression' &&
    node.expression.callee.type === 'MemberExpression' && node.expression.callee.object.name === 'app' &&
    node.expression.callee.property.name === 'use' ) {
        return true;
    }
    return false;
}

function isEpMiddleware(node) {
    if(!isAppUse(node) ) {
        return false;
    }
    // console.log(node);
    var n = node.expression.arguments[0];
    if(!n) {
        return false;
    }
    if(n.type === 'CallExpression' && n.callee.property.name === 'getQualifiedTreatments') {
        // console.log(n);
        return true;
    }
    return false;
}

function isMainMiddleware(node) {
    if(!isAppUse(node) ) {
        return false;
    }
    var n = node.expression.arguments[0];
    if(!n) {
        return false;
    }
    if(n.type === 'FunctionExpression' ) {
        return true;
    }
    return false;
}

function isExportApp(n) {
    if(!n) {
        return false;
    }
    if(n.type !== 'ExpressionStatement') {
        return false;
    }
    var name = u.get(n, 'expression.left.name');
    var name2 = u.get(n, 'expression.right.name')
    if(name === 'exports' &&  name2 === 'app') {
        return true;
    }
    name = u.get(n, 'expression.left.property.name');
    if(name === 'exports' &&  name2 === 'app') {
        return true;
    }
    return false;
}


function transformEpMiddleware(ast) {
    var cfg = esgraph(ast);
    var nodes = cfg[2];
    var i = 0;

    var epMiddlewareStatement = null;
    var epNode = null;
    // console.log('---AST---');
    // console.log(ast);
    var body = ast.body;
    var epMiddleware = {};
    var mainMiddleware = {};

    nodes.forEach(function(n) {
        // console.log(i);
        i++;
        var node = n.astNode;
        // console.log('nd:', node);
        if(node) {
            // console.log(node.type);
            if(isEpMiddleware(node)) {
                epMiddleware.target = node.expression.arguments[0];
                epMiddleware.node = node;
            } else if(isMainMiddleware(node) ) {
                mainMiddleware.node = node;
                mainMiddleware.target = node.expression.arguments[0];
                var funBody = node.expression.arguments[0].body.body;
                if(!epMiddleware.target && funBody) {
                    funBody.unshift(epMiddleware.target);
                }
            } else if(isExportApp(node)) {
                node.expression.right = mainMiddleware.target;
            }


        }

    });

    // u.remove(epMiddleware.node, body);


    return ast;

}

function transformAST(ast, options, moduleOptions) {

    var epMiddleware = {};
    var mainMiddleware = {};


    ast = estraverse.replace(ast, {
        enter: function(node, parent) {
        },

        leave: function(node, parent) {
            if (node && node.type === 'CallExpression' && node.callee &&
                node.callee.type === 'Identifier' &&
                node.callee.name === 'require' &&
                node.arguments &&
                node.arguments[0] &&
                node.arguments[0].type === 'Literal' &&
                node.arguments[0].value === 'ebay-ep' ) {

                delete node.arguments[0].raw;
                // node.arguments[0].value = moduleOptions.srcRelative +'src/migrate/experimentation-ebay';
                node.arguments[0].value = 'src/migrate/experimentation-ebay';


            }
            // console.log('transform ep');

            if(isEpMiddleware(node)) {
                // console.log('isEpMiddleware');
                epMiddleware.target = node.expression.arguments[0];
                epMiddleware.node = node;
                tu.remove(node, parent);

            } else if(isMainMiddleware(node) ) {
                mainMiddleware.node = node;
                var arg = node.expression.arguments[0];
                mainMiddleware.target = arg;


                var funBody = arg && arg.body && arg.body.body;
                // console.log(epMiddleware.target);
                // console.log(funBody);
                var epMiddlewareStatement = {
                    "type": "ExpressionStatement",
                    "expression" : epMiddleware.target
                };

                if(epMiddleware.target && funBody) {
                    funBody.unshift(epMiddlewareStatement);
                }

                tu.remove(node,parent);

            } else if(isExportApp(node)) {
                node.expression.right = mainMiddleware.target;
            }




        }
    });

    transformEpMiddleware(ast);

    return ast;
}

exports.transformAST = transformAST;
