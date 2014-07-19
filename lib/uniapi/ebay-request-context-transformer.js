'use strict';

require('raptor-polyfill');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');

function hasHost(node) {
    if(!node || !node.type) {
        return false;
    }
    if(node.type !== 'CallExpression') {
        return false;
    }
    if(!node.callee || !node.callee.property) {
        return false;
    }
    if(node.callee.property.name === 'isHostInNetwork') {
        return true;
    }
    return false;
}

function transformAST(ast, options, moduleOptions) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {},

        leave: function(node, parent) {
            if (node && node.type === 'CallExpression' &&
                node.callee &&
                node.callee.type === 'Identifier' &&
                node.callee.name === 'require' &&
                node.arguments &&
                node.arguments[0] &&
                node.arguments[0].type === 'Literal' &&
                node.arguments[0].value === 'ebay-request-context'
            ) {

                node.type = 'ObjectExpression';
                node.properties = [];
                delete node.callee;
                delete node.arguments;

                // node = {
                //         "type": "ObjectExpression",
                //         "properties": []
                //     };

                // console.log('---', node);

            }

            if (hasHost(node) ) {
                var newnode = {
                    "type": "MemberExpression",
                    "computed": false,
                    "object": {
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
                                "arguments": [{
                                    "type": "Literal",
                                    "value": "commons-ebay",
                                    "raw": "'commons-ebay'"
                                }]
                            },
                            "property": {
                                "type": "Identifier",
                                "name": "isInternalHost"
                            }
                        },
                        "arguments": []
                    },
                    "property": {
                        "type": "Identifier",
                        "name": "isInternal"
                    }
                };
                node.type = newnode.type;
                node.computed = newnode.computed;
                node.object = newnode.object;
                node.property = newnode.property;
            } // isHostInNetwork

        }
    });

    return ast;
}

exports.transformAST = transformAST;
