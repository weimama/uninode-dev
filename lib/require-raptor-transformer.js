'use strict';

require('raptor-ecma/es6');
var estraverse = require('estraverse');

function transformAST(ast, options) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {
        },

        leave: function(node, parent) {
            if (node.type === 'CallExpression' &&
                node.callee.type === 'Identifier' &&
                node.callee.name === 'require' &&
                node.arguments.length === 1 &&
                node.arguments[0].type === 'Literal' &&
                typeof node.arguments[0].value === 'string') {
                
                var target = node.arguments[0].value;
                var resolved = null;

                if (target.startsWith('raptor/')) {
                    var targetParts = target.split('/');
                    if (targetParts.length >= 2) {

                        targetParts.shift();

                        if (targetParts[0] === 'templating') {
                            targetParts[0] = 'templates';
                        }

                        targetParts[0] = 'raptor-' + targetParts[0];


                        resolved = targetParts.join('/');
                    }
                }

                if (resolved) {
                    node.arguments[0].value = resolved;
                }
            }

        }
    });

    return ast;
}

exports.transformAST = transformAST;