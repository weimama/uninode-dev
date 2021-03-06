'use strict';

require('raptor-polyfill');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');
var u = require('./util');
var remove = require('../transform-util').remove;

function checkLogger(n) {
    if (!n) {
        return false;
    }
    if (n.type !== 'CallExpression') {
        return false;
    }
    var pname = u.get(n, 'callee.property.name');
    var ptype = u.get(n, 'callee.property.type');
    if (pname !== 'logger' || ptype !== 'Identifier') {
        return false;
    }

    var name = u.get(n, 'callee.object.property.name');
    var type = u.get(n, 'callee.object.property.type');
    if (name === 'ebay' && type === 'Identifier') {
        return true;
    }
    type = u.get(n, 'callee.object.type');
    name = u.get(n, 'callee.object.name');
    if (type === 'Identifier' && name === 'ebayRequestContext') {
        return true;
    }

    return false;
}

function transformEbayLogger(n) {
    if (checkLogger(n)) {

        n.callee.object = {
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": "require"
            },
            "arguments": [{
                "type": "Literal",
                "value": "logging-inc"
            }]
        };
    }


}

function checkEvent(n) {
    if(!n) {
        return false;
    }
    if (n.type !== 'CallExpression') {
        return false;
    }
    var type = u.get(n, 'callee.property.type');
    var name = u.get(n, 'callee.property.name');
    if(type === 'Identifier' && (name === 'debugEvent' || name === 'errorEvent')  ) {
        return true;
    }
    return false;
}

function transformEvent(n) {
    if(! checkEvent(n) ) {
        return;
    }
    var name = n.callee.property.name;
    n.callee.property.name = name.substring(0, name.length-5);
}


function checkBegin(n) {
    if(!n) {
        return false;
    }
    if(n.type !== 'CallExpression' ) {
        return false;
    }
    if(!n.callee) {
        return false;
    }
    if(!n.callee.object) {
        return false;
    }
    var name = u.get(n, 'callee.property.name');
    var type = u.get(n, 'callee.property.type');
    if(name !== 'begin' || type !== 'Identifier') {
        return false;
    }
    type = u.get(n, 'callee.type');
    if(type !== 'MemberExpression') {
        return false;
    }
    if(n.arguments && n.arguments.length === 2) {
        return true;
    }
    return false;
}

function transformBegin(n) {
    if(!checkBegin(n)) {
        return;
    }
    var m = n.callee.object;
    n.type = m.type;
    n.computed = m.computed;
    n.object = m.object;
    n.property = m.property;

    delete n.callee;
    delete n.arguments;
}

function checkEnd(n) {
    if(!n) {
        return false;
    }
    if(n.type !== 'ExpressionStatement') {
        return false;
    }
    if(!n.expression) {
        return false;
    }
    var type = u.get(n, 'expression.type');
    if(type !== 'CallExpression') {
        return false;
    }
    var arg = u.get(n, 'expression.arguments');
    if(!arg || arg.length !==0 ) {
        return false;
    }
    var name = u.get(n, 'expression.callee.property.name');
    if(name !== 'end') {
        return false;
    }
    type = u.get(n, 'expression.callee.property.type');
    if(type !== 'Identifier') {
        return false;
    }
    type = u.get(n, 'expression.callee.type');
    if(type !== 'MemberExpression') {
        return false;
    }
    name = u.get(n, 'expression.callee.object.name');
    if(name !== 'logger') {
        return false;
    }
    type = u.get(n,'expression.callee.object.type');
    if(type !== 'Identifier') {
        return false;
    }
    return true;
}

function transformEnd(n, parent) {
    if( !checkEnd(n) ) {
        return ;
    }

    remove(n, parent);
}

function transformAST(ast, options, moduleOptions) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {},

        leave: function(node, parent) {

            transformEbayLogger(node);
            transformEvent(node);
            transformBegin(node);
            transformEnd(node,parent);

        }
    });

    return ast;
}

exports.transformAST = transformAST;
