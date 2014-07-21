'use strict';

require('raptor-polyfill');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');
var u = require('./util');

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

function checkRequireGuid(n) {
    if(!n) {
        return false;
    }
    if(n.type !== 'CallExpression') {
        return false;
    }
    var name = u.get(n, 'callee.name');
    if(name !== 'require') {
        return false;
    }
    var type = u.get(n, 'callee.type');
    if(type !== 'Identifier') {
        return false;
    }
    type = u.get(n, 'arguments.0.type');
    if(type !== 'Literal') {
        return false;
    }
    var value = u.get(n, 'arguments.0.value');
    if(value !== 'ebay-guid') {
        return false;
    }
    return true;

}

function transformRequireGuid(n) {
    if(!checkRequireGuid(n)) {
        return;
    }
    n.callee.arguments[0].value = 'commons-ebay';
    delete n.callee.arguments[0].raw;
}

function transformAST(ast, options, moduleOptions) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {
        },

        leave: function(node, parent) {

             transformGuid(node);
             transformRequireGuid(node);

        }
    });

    return ast;
}

exports.transformAST = transformAST;
