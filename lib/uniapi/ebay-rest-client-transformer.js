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
                node.arguments[0].value === 'ebay-rest-client' ) {

                delete node.arguments[0].raw;
                node.arguments[0].value = '../../migrate/serviceUtil';


                // console.log('file:', moduleOptions.migratePath + '/module-config');
                // node.callee.object = {
                //                 "type": "CallExpression",
                //                 "callee": {
                //                     "type": "Identifier",
                //                     "name": "require"
                //                 },
                //                 "arguments": [
                //                     {
                //                         "type": "Literal",
                //                         "value": "user-ebay",
                //                         "raw": "'user-ebay'"
                //                     }
                //                 ]
                //             };



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
