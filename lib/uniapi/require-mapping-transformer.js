'use strict';

require('raptor-polyfill');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');
var u = require('./util');

function check(n, sourceName) {
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
    if(!n.arguments) {
        return false;
    }
    if(!n.arguments[0]) {
        return false;
    }
    var arg = n.arguments[0];
    type = arg.type
    if(type !== 'Literal') {
        return false;
    }


    if(arg.value !== sourceName) {
        return false;
    }

    return true;

}

function transformRequire(n, sourceName, targetName) {
    if(!check(n, sourceName)) {
        return;
    }
    n.arguments[0].value = targetName;
    delete n.arguments[0].raw;
}

function transformAST(ast, options, moduleOptions) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {
        },

        leave: function(node, parent) {

            var mapping = require('./requireMapping.json');
            Object.keys(mapping).forEach(function(key) {
                var sourceName = key;
                var targetName = mapping[key];
                // console.log(sourceName, targetName);
                transformRequire(node, sourceName, targetName);
            });

            //  transformRequire(node, sourceName, targetName);

        }
    });

    return ast;
}

exports.transformAST = transformAST;
