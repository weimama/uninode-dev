'use strict';

require('raptor-polyfill');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');
var u = require('./util');


function checkRequire(n) {
    if(!n) {
        return false;
    }
    if(n.type !== 'CallExpression') {
        return false;
    }
    var name = u.get(n, 'callee.name');
    if(name !== 'require') {
        return false;
    }
    var type = u.get(n, 'callee.type');
    if(type !== 'Identifier') {
        return false;
    }
    type = u.get(n, 'arguments.0.type');
    if(type !== 'Literal') {
        return false;
    }
    var value = u.get(n, 'arguments.0.value');
    if(value !== 'ebay-auth') {
        return false;
    }
    return true;

}

function transformRequire(n) {
    if(!checkRequire(n)) {
        return;
    }
    n.callee.arguments[0].value = 'auth-ebay';
    delete n.callee.arguments[0].raw;
}

function transformAST(ast, options, moduleOptions) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {
        },

        leave: function(node, parent) {

             transformRequire(node);

        }
    });

    return ast;
}

exports.transformAST = transformAST;
