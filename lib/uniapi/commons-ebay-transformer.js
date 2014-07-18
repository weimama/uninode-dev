'use strict';

require('raptor-polyfill');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');


function hasCommonsNode(node, name) {
    if (!node || !node.callee || !node.callee.property) {
        return false;
    }
    return node.callee.property.name === name;
}

function hasCommons(node) {
    var arr = ['getSiteId', 'getMarketplaceId', 'getTerritoryId'];
    var r = false;
    arr.forEach(function(a) {
        r = r || hasCommonsNode(node, a);
    });
    return r;
}

function checkRequest(n) {
    if (!n) {
        return false;
    }
    if (n.type !== 'MemberExpression') {
        return false;
    }
    if (n.object && n.object.property && n.object.property.name ===
        'attributes' && n.property && n.property.name === 'request') {
        return true;
    }
    return false;
}

function transformRequest(n) {
    if (!checkRequest(n)) {
        return;
    }
    var m = {
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
                "name": "getFromCtx"
            }
        },
        "arguments": [{
            "type": "Literal",
            "value": "req",
            "raw": "'req'"
        }]
    };

    n.type = m.type;
    n.callee = m.callee;
    n.arguments = m.arguments;
    delete n.computed;
    delete n.object;
    delete n.property;

}

function transformAST(ast, options, moduleOptions) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {},

        leave: function(node, parent) {

            if (node.type === 'CallExpression' &&
                node.callee.type === 'MemberExpression' &&
                (node.callee.object.type === 'Identifier' || node.callee.object
                    .type === 'MemberExpression') &&
                node.callee.property.type === 'Identifier' &&
                hasCommons(node) &&
                node.arguments.length === 0
            ) {
                // console.log('---:', moduleOptions.file, node);


                delete node.callee.object;
                node.callee.object = {
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
                };

            }

            transformRequest(node);

        }
    });

    return ast;
}

exports.transformAST = transformAST;
