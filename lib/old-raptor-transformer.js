require('raptor-ecma/es6');
var remove = require('./transform-util').remove;
var estraverse = require('estraverse');
var forEachEntry = require('raptor-util').forEachEntry;
// var insert = require('./transform-util').insert;

var raptorMethods = {
    'forEachEntry': 'raptor-util',
    'extend': 'raptor-util',
    'createError': 'raptor-util'
};

function transformAST(ast, options) {
    var foundTopLevelVars = {};
    var requiredRaptorVars = {};

    function fixRaptorCall(node) {

        var raptorMethodName;

        if (node.type === 'MemberExpression') {
            if (node.object.type === 'CallExpression' &&
                node.object.callee.name === 'require' && 
                node.object.arguments.length === 1 &&
                node.object.arguments[0].value === 'raptor' &&
                node.property.type === 'Identifier') {

                raptorMethodName = node.property.name;

                // Left side is  "require('raptor')"
                if (raptorMethods.hasOwnProperty(raptorMethodName)) {
                    node.object.arguments[0].value = raptorMethods[raptorMethodName];
                    delete node.object.arguments[0].raw;
                }
            }
        }
        else if (node.type === 'CallExpression') {
            if (node.callee.type === 'MemberExpression' &&
                node.callee.object.type === 'Identifier' &&
                node.callee.object.name === 'raptor' &&
                node.callee.property.type === 'Identifier') {

                raptorMethodName = node.callee.property.name;
                if (raptorMethods.hasOwnProperty(raptorMethodName)) {
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
                            if (raptorMethods.hasOwnProperty(raptorMethodName)) {
                                requiredRaptorVars[raptorMethodName] = true;
                                return false;
                            }
                        }

                        if (decl.init) {
                            fixRaptorCall(decl.init);    
                        }
                        
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
                                        "value": raptorMethods[varName],
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