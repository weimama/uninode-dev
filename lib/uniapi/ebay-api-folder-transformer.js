'use strict';

require('raptor-polyfill');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');
var replace = require('../transform-util').replace;

function check(n) {
    if(!n) {
        return false;
    }
    if(n.type !== 'CallExpression') {
        return false;
    }
    var c = n.callee;
    if(!c) {
        return false;
    }
    var co = c.object;
    if(!co) {
        return false;
    }
    if(co.name !== 'JSON') {
        return false;
    }
    var cp = c.property;
    if(!cp) {
        return false;
    }
    if(cp.name !== 'parse') {
        return false;
    }
    var a = n.arguments;
    if(!a) {
        return false;
    }
    a = a[0];
    if(!a) {
        return false;
    }
    var ao = a.object;
    if(!ao) {
        return false;
    }
    if(ao.name !== 'response') {
        return false;
    }
    var ap = a.property;
    if(!ap) {
        return false;
    }
    if(ap.name !== 'body') {
        return false;
    }
    return true;
}


function transformAST(ast, options, moduleOptions) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {},

        leave: function(node, parent) {
            if ( check(node) ) {
                var newnode = {
                    "type": "MemberExpression",
                    "computed": false,
                    "object": {
                        "type": "Identifier",
                        "name": "response"
                    },
                    "property": {
                        "type": "Identifier",
                        "name": "body"
                    }
                };

                // console.log(node);

                node.type = newnode.type;
                node.object = newnode.object;
                node.computed = newnode.computed;
                node.property = newnode.property;
                delete node.callee;
                delete node.arguments;

            }



        }

    });

    return ast;
}

exports.transformAST = transformAST;
