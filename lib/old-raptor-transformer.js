require('raptor-ecma/es6');
var remove = require('./transform-util').remove;
var estraverse = require('estraverse');
var forEachEntry = require('raptor-util').forEachEntry;
// var insert = require('./transform-util').insert;

function transformAST(ast, options) {
    var foundTopLevelVars = {};
    var requiredRaptorVars = {};

    function fixRaptorCall(node) {
        if (node.type === 'MemberExpression') {
            if (node.object.type === 'CallExpression' &&
                node.object.callee.name === 'require' && 
                node.object.arguments.length === 1 &&
                node.object.arguments[0].value === 'raptor' &&
                node.property.type === 'Identifier') {

                // Left side is  "require('raptor')"
                if (node.property.name === 'extend' || node.property.name === 'forEachEntry') {
                    node.object.arguments[0].value = 'raptor-util';
                    delete node.object.arguments[0].raw;
                }
            }
        }
        else if (node.type === 'CallExpression') {
            if (node.callee.type === 'MemberExpression' &&
                node.callee.object.type === 'Identifier' &&
                node.callee.object.name === 'raptor' &&
                node.callee.property.type === 'Identifier') {

                var raptorMethodName = node.callee.property.name;
                if (raptorMethodName === 'extend' || raptorMethodName === 'forEachEntry') {
                    requiredRaptorVars[raptorMethodName] = true;
                    node.callee = {
                        "type": "Identifier",
                        "name": raptorMethodName
                    };
                }
            }
        }
        else if (node.type === 'CallExpression') {
            if (node.callee.type === 'MemberExpression' &&
                node.callee.object.type === 'Identifier' &&
                node.callee.object.name === 'raptor' &&
                node.callee.property.type === 'Identifier') {

                var raptorMethodName = node.callee.property.name;
                if (raptorMethodName === 'extend' || raptorMethodName === 'forEachEntry') {
                    requiredRaptorVars[raptorMethodName] = true;
                    node.callee = {
                        "type": "Identifier",
                        "name": raptorMethodName
                    };
                }
            }
        }
    }

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {
        },

        leave: function(node, parent) {
            if (node.type === 'VariableDeclaration') {
                node.declarations = node.declarations.filter(function(decl) {
                        if (parent.type === 'Program') {
                            foundTopLevelVars[decl.id.name] = true;
                        }

                        if (decl.id.type === 'Identifier' &&
                            decl.id.name === 'raptor') {
                            return false;
                        }

                        if (decl.init && decl.init.type === 'MemberExpression' &&
                            decl.init.object.type === 'Identifier' &&
                            decl.init.object.name === 'raptor' &&
                            decl.init.property.type === 'Identifier') {
                            
                            var raptorMethodName = decl.init.property.name;
                            if (raptorMethodName === 'extend' || raptorMethodName === 'forEachEntry') {
                                requiredRaptorVars[raptorMethodName] = true;
                                return false;
                            }
                        }


                        fixRaptorCall(decl.init);
                        return true;
                    });

                if (node.declarations.length === 0) {
                    remove(node, parent);
                }
            }
            else if (node.type === 'ExpressionStatement') {
                fixRaptorCall(node.expression);
            }

        }
    });

    var missingVarNodes = [];
    forEachEntry(requiredRaptorVars, function(varName) {
        if (!foundTopLevelVars[varName]) {
            missingVarNodes.push({
                "type": "VariableDeclaration",
                "declarations": [
                    {
                        "type": "VariableDeclarator",
                        "id": {
                            "type": "Identifier",
                            "name": varName
                        },
                        "init": {
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
                                        "value": "raptor-util",
                                        "raw": "'raptor-util'"
                                    }
                                ]
                            },
                            "property": {
                                "type": "Identifier",
                                "name": varName
                            }
                        }
                    }
                ],
                "kind": "var"
            });
        }
    });

    // console.log(JSON.stringify(missingVarNodes, null, '    '));

    ast.body.splice.apply(ast.body, [0, 0].concat(missingVarNodes));

    // console.log(JSON.stringify(ast.body, null, '    '));

    return ast;
}

exports.transformAST = transformAST;