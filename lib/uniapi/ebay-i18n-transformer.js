'use strict';

require('raptor-polyfill');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');



function transformAST(ast, options, moduleOptions) {

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
                node.arguments[0].value === 'ebay-i18n' ) {

                delete node.arguments[0].raw;
                node.arguments[0].value = 'i18n-ebay';

            }

            if(node && node.type === 'CallExpression' && node.callee &&
            node.callee.type === 'MemberExpression' &&
            node.callee.property &&
            node.callee.property.name === 'getContentManager' &&
            node.callee.property.type === 'Identifier'
            ) {
                node.callee = {
                            "type": "Identifier",
                            "name": "require"
                        };
                node.arguments = [
                            {
                                "type": "Literal",
                                "value": "i18n-ebay",
                                "raw": "'i18n-ebay'"
                            }
                        ];

            }



        }
    });

    return ast;
}

exports.transformAST = transformAST;
