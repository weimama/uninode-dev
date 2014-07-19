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


function isDataProviders(node) {
    if (node && node.type === 'CallExpression' && node.callee && node.callee.type ===
        'MemberExpression' && node.callee.property &&
        node.callee.property.name === 'dataProviders' && node.callee.property.type ===
        'Identifier') {
        return true;
    }
    return false;
}

function isRenderTemplate(node) {
    if (!node) {
        return false;
    }
    if (node && node.type === 'CallExpression' && node.callee && node.callee.type ===
        'MemberExpression' && node.callee.property &&
        node.callee.property.name === 'renderTemplate' && node.callee.property.type ===
        'Identifier') {
        return true;
    }
    return false;
}

function isRenderTemplateNode(n) {
    if (n && n.type === 'ExpressionStatement' && isRenderTemplate(n.expression)) {
        return true;
    }
    return false;
}

function transformRender(node, parent) {
    var expNode = node.expression;
    var templateFileNameArg = expNode.arguments[0];

    expNode.callee.object.name = '_';
    expNode.callee.property.name = 'extend';
    expNode.arguments[0] = {
        "type": "Identifier",
        "name": "viewModel"
    };
    if (expNode.arguments.length === 1) {
        expNode.arguments.push({
            "type": "ObjectExpression",
            "properties": []
        });
    }

    var newStatArr = [];



    var templateFileStatement = {
        "type": "ExpressionStatement",
        "expression": {
            "type": "AssignmentExpression",
            "operator": "=",
            "left": {
                "type": "Identifier",
                "name": "templateFile"
            }
        }
    };
    templateFileStatement.expression.right = templateFileNameArg;
    newStatArr.push(templateFileStatement);

    var templateFileBaseStatement = {
        "type": "ExpressionStatement",
        "expression": {
            "type": "AssignmentExpression",
            "operator": "=",
            "left": {
                "type": "Identifier",
                "name": "templateFile"
            },
            "right": {
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
                            "value": "path",
                            "raw": "'path'"
                        }]
                    },
                    "property": {
                        "type": "Identifier",
                        "name": "basename"
                    }
                },
                "arguments": [{
                    "type": "Identifier",
                    "name": "templateFile"
                }]
            }
        }
    };
    newStatArr.push(templateFileBaseStatement);

    var templateStatement = {
        "type": "ExpressionStatement",
        "expression": {
            "type": "AssignmentExpression",
            "operator": "=",
            "left": {
                "type": "Identifier",
                "name": "template"
            },
            "right": {
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
                            "value": "raptor-templates",
                            "raw": "'raptor-templates'"
                        }]
                    },
                    "property": {
                        "type": "Identifier",
                        "name": "load"
                    }
                },
                "arguments": [{
                    "type": "CallExpression",
                    "callee": {
                        "type": "MemberExpression",
                        "computed": false,
                        "object": {
                            "type": "Identifier",
                            "name": "require"
                        },
                        "property": {
                            "type": "Identifier",
                            "name": "resolve"
                        }
                    },
                    "arguments": [{
                        "type": "Identifier",
                        "name": "templateFile"
                    }]
                }]
            }
        }
    };

    newStatArr.push(templateStatement);


    var renderStatement = {
        "type": "ExpressionStatement",
        "expression": {
            "type": "CallExpression",
            "callee": {
                "type": "MemberExpression",
                "computed": false,
                "object": {
                    "type": "Identifier",
                    "name": "template"
                },
                "property": {
                    "type": "Identifier",
                    "name": "render"
                }
            },
            "arguments": [{
                "type": "Identifier",
                "name": "viewModel"
            }, {
                "type": "Identifier",
                "name": "res"
            }]
        }
    };

    newStatArr.push(renderStatement);

    insertAfter(node, parent, newStatArr);
}

function transformAST(ast) {
    var varDeclarations = [];

    // console.log("FIX VAR: ", JSON.stringify(ast, null, '    '));

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {
            if (isDataProviders(node)) {
                // console.log(node);
                node.callee.object.name = '_';
                node.callee.property.name = 'extend';
                node.arguments.unshift({
                    "type": "Identifier",
                    "name": "viewModel"
                });
            }

        },

        leave: function(node, parent) {
            if (isRenderTemplateNode(node)) {
                // console.log(node);
                transformRender(node, parent);

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
