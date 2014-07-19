'use strict';

var esprima = require('esprima');
var escodegen = require('escodegen');
var estraverse = require('estraverse');
var replace = require('../transform-util').replace;
var remove = require('../transform-util').remove;
var insertBefore = require('../transform-util').insertBefore;
var insertAfter = require('../transform-util').insertAfter;
var idNodeToArray = require('../transform-util').idNodeToArray;
var idArrayToNode = require('../transform-util').idArrayToNode;

function isAppUse(node) {
    if(node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression' &&
    node.expression.callee.type === 'MemberExpression' && node.expression.callee.object.name === 'app' &&
    node.expression.callee.property.name === 'use' ) {
        return true;
    }
    return false;
}

function isPageMiddleware(node) {
    if(!isAppUse(node) ) {
        return false;
    }
    var n = node.expression.arguments[0];
    if(!n) {
        return false;
    }
    if(n.type === 'CallExpression' && n.callee.property.name === 'pageName') {
        return true;
    }
    return false;
}

function isTrackingMiddleware(node) {
    if(!isAppUse(node) ) {
        return false;
    }
    // console.log(node);
    var n = node.expression.arguments[0];
    if(!n) {
        return false;
    }
    if(n.type === 'CallExpression' && n.callee.property.name === 'tracking') {
        // console.log(n);
        return true;
    }
    return false;
}

function isSiteSpeedMiddleware(node) {
    if(!isAppUse(node) ) {
        return false;
    }
    // console.log(node);
    var n = node.expression.arguments[0];
    if(!n) {
        return false;
    }
    if(n.type === 'CallExpression' && n.callee.property.name === 'siteSpeedGauge') {
        // console.log(n);
        return true;
    }
    return false;
}

function isEpMiddleware(node) {
    if(!isAppUse(node) ) {
        return false;
    }
    // console.log(node);
    var n = node.expression.arguments[0];
    if(!n) {
        return false;
    }
    if(n.type === 'CallExpression' && n.callee.property.name === 'getQualifiedTreatments') {
        // console.log(n);
        return true;
    }
    return false;
}



function transformAST(ast) {
    var varDeclarations = [];

    // console.log("FIX VAR: ", JSON.stringify(ast, null, '    '));

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {

        },

        leave: function(node, parent) {
            if( isPageMiddleware(node) ) {
                // console.log(node);
                remove(node,parent);
            } else if( isTrackingMiddleware(node) ) {
                // console.log(node);
                remove(node,parent);
            } else if( isSiteSpeedMiddleware(node) ) {
                // console.log(node);
                remove(node,parent);
            } else if( isEpMiddleware(node) ) {
                // console.log(node);
                //TODO: keep ep temporarily
                remove(node,parent);
            }

        }
    });



    return ast;
}

function transform(src, options) {
    var ast = esprima.parse(src, {
        raw: true,
        tokens: true,
        range: true,
        comment: true
    });

    escodegen.attachComments(ast, ast.comments, ast.tokens);

    ast = transformAST(ast, options);


    var codegenOptions = {
        comment: true,
        format: {
            indent: {
                style: '    ',
                adjustMultilineComment: true
            },
            quotes: 'single'
        }
    };

    return escodegen.generate(ast, codegenOptions);
}

exports.transform = transform;
