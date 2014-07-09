'use strict';

require('raptor-polyfill');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');



function transformAST(ast, options) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {
        },

        leave: function(node, parent) {
            if (node.type === 'CallExpression' &&
                node.callee.type === 'MemberExpression' &&
                node.callee.object.type === 'Identifier' &&
                node.callee.object.name === 'context' && //limit to context variable for now
                node.callee.property.type === 'Identifier' &&
                node.callee.property.name === 'beginAsyncFragment' ) {
                node.callee.property.name = 'beginAsync';
            }

        }
    });

    return ast;
}

exports.transformAST = transformAST;
