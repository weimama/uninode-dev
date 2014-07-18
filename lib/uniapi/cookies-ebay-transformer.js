'use strict';

require('raptor-polyfill');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');

function eq(node, name) {
    return node.callee.property.name === name;
}

function check(node) {
    return eq(node, 'getCookieManager');
}

function transformAST(ast, options, moduleOptions) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {
        },

        leave: function(node, parent) {
            if (node.type === 'CallExpression' && node.callee.property &&
                node.callee.property.type === 'Identifier' &&
                ( check(node) )  ) {

            var newnode = {
                        "type": "CallExpression",
                        "callee": {
                            "type": "MemberExpression",
                            "computed": false,
                            "object": {
                                "type": "CallExpression",
                                "callee": {
                                    "type": "Identifier",
                                    "name": "require"
                                },
                                "arguments": [
                                    {
                                        "type": "Literal",
                                        "value": "cookies-ebay",
                                        "raw": "'cookies-ebay'"
                                    }
                                ]
                            },
                            "property": {
                                "type": "Identifier",
                                "name": "getCookieManager"
                            }
                        },
                        "arguments": []
                    };

                node.type = newnode.type;
                node.callee = newnode.callee;
                node.arguments = newnode.arguments;





                // delete node.arguments[0].raw;
                // node.arguments[0].value = moduleOptions.migratePath + '/module-config';
                // node.arguments[0].value = 'raptor-promises';
                // delete node.arguments[0].raw = "'module-config-inc'";
                // console.log('----', node);
                // console.log('$:', node.arguments[0]);

            }

        }
    });

    return ast;
}

exports.transformAST = transformAST;
