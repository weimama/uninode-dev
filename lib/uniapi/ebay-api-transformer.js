'use strict';

require('raptor-polyfill');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');
var replace = require('../transform-util').replace;

function check(n) {
    if(n.type === 'CallExpression' && n.callee && n.callee.object && n.callee.object.name === 'JSON' &&
    n.callee.property && n.callee.property.name === 'parse' ) {
        return true;
    }
    return false;
}

function transformAST(ast, options, moduleOptions) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {},

        leave: function(node, parent) {
            if ( check(node) ) {
                var newnode = node.arguments[0];
                node.type = newnode.type;
                node.object = newnode.object;
                node.computed = newnode.computed;
                node.property = newnode.property;
                delete node.callee;
                delete node.arguments;
                // replace(node, parent, newnode);


            }


        }

    });

    return ast;
}

exports.transformAST = transformAST;
