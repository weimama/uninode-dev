'use strict';

require('raptor-polyfill');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');

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
    var cp = c.property;
    var co = c.object;
    if(cp && cp.name === 'getGuid') {
        if(co && co.callee) {
            if(co.callee.name === 'require') {
                var ca = co.arguments;
                if(ca) {
                    ca = ca[0];
                    if(ca.value === 'ebay-guid') {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function transformGuid(n) {
    if(!check(n)) {
        return false;
    }
    n.arguments = [];
    n.callee.object.arguments[0].value = 'commons-ebay';
    delete n.callee.object.arguments[0].raw;
}

function transformAST(ast, options, moduleOptions) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {
        },

        leave: function(node, parent) {

             transformGuid(node);

        }
    });

    return ast;
}

exports.transformAST = transformAST;
