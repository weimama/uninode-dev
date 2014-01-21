var estraverse = require('estraverse');
var replace = require('./transform-util').replace;
var insertBefore = require('./transform-util').insertBefore;
var idNodeToArray = require('./transform-util').idNodeToArray;
var idArrayToNode = require('./transform-util').idArrayToNode;

var ok = require('assert').ok;

function getDefineRequireNodes(def) {
    return def.dependencyNodes
        .map(function(depNode, i) {
            var moduleId = depNode.value;
            var param = def.factoryFunctionParams[i];
            var varName = param ? param.name : null;
            return {
                moduleId: moduleId,
                varName: varName
            };
        })
        .filter(function(dep) {
            return dep.varName && dep.varName !== 'require' && dep.varName !== 'module' && dep.varName !== 'exports';
        })
        .map(function(dep) {
            return {
                "type": "VariableDeclaration",
                "declarations": [
                    {
                        "type": "VariableDeclarator",
                        "id": {
                            "type": "Identifier",
                            "name": dep.varName
                        },
                        "init": {
                            "type": "CallExpression",
                            "callee": {
                                "type": "Identifier",
                                "name": "require"
                            },
                            "arguments": [
                                {
                                    "type": "Literal",
                                    "value": dep.moduleId
                                    // "raw": "'foo'"
                                }
                            ]
                        }
                    }
                ],
                "kind": "var"
            };
        });
}

function parseCallExpression(expression) {
    if (expression.type === 'CallExpression' &&
        expression.callee.type === 'Identifier' &&
        expression.callee.name === 'define') {
        return {
            type: 'define',
            args: expression.arguments
        };
    }

    if (expression.type === 'CallExpression' &&
        expression.callee.type === 'MemberExpression' &&
        expression.callee.object.type === 'Identifier' &&
        expression.callee.object.name === 'define' && 
        expression.callee.property.type === 'Identifier' &&
        expression.callee.property.name === 'Class') {
        return {
            type: 'define.Class',
            args: expression.arguments
        };
    }
}

function parseExpressionStatement(node) {
    var parsed = parseCallExpression(node.expression);

    if (parsed) {
        parsed.isAssignment = false;
        return parsed;
    }
}

function parseDefineNode(node) {

    var parsed = null;

    if (node.type === 'ExpressionStatement') {
        parsed = parseExpressionStatement(node);
    }

    if (!parsed) {
        return null;
    }

    var args = parsed.args;

    ok(args);

    parsed.returnStatements = [];
    parsed.curLevel = 0;
    parsed.factoryFunctionParams = [];
    parsed.dependencyNodes = [];
    parsed.scope = {};
    parsed.getIdLastPart = function() {
        var parts = this.id.split('/');
        return parts[parts.length-1];
    };

    for (var i=0; i<args.length; i++) {
        var arg = args[i];
        if (arg.type === 'Literal') {
            if (parsed.id) {
                parsed.superclass = arg.value;
            }
            else {
                parsed.id = arg.value;    
            }
            
        }
        else if (arg.type === 'ObjectExpression') {
            arg.properties.forEach(function(prop) {
                if (prop.key.name === 'superclass') {
                    parsed.superclass = prop.value.value;
                }
            });
        }
        else if (arg.type === 'ArrayExpression') {
            parsed.dependencyNodes = arg.elements;
        }
        else if (arg.type === 'FunctionExpression') {
            parsed.factoryFunctionNode = arg;
            parsed.factoryFunctionParams = arg.params;
        }
    }

    return parsed;
}


function fixUseStrict(ast) {
    // remove "use strict"
    var useStrictFound = false;
    ast.body = ast.body.filter(function(node) {
        
        if (node.type === 'ExpressionStatement' &&
            node.expression.type === 'Literal' &&
            node.expression.value === 'use strict') {
            useStrictFound = true;
            return false;
        }

        return true;
    });

    if (useStrictFound) {
        ast.body.unshift({
            "type": "ExpressionStatement",
            "expression": {
                "type": "Literal",
                "value": "use strict",
                "raw": "'use strict'"
            }
        });
    }
}


function fixReturnStatements(def) {
    function fixReturnStatement(node, parent, isLast) {

        var moduleExportsRight = node.argument;

        if (def.type === 'define.Class' && node.argument.type === 'ObjectExpression') {
            // We need to convert the object to a constructor function and prototype
            var protoObject = node.argument;
            var ctor = null;

            var newNodes = [];

            protoObject.properties = protoObject.properties.filter(function(prop) {
                if (prop.key.name === 'init') {
                    ctor = prop.value;
                    return false;
                }

                return true;
            });

            var ctorVarName = def.getIdLastPart();

            if (ctor) {
                ctor.type = 'FunctionDeclaration';
                ctor.id = {
                    type: "Identifier",
                    name: ctorVarName
                };
                newNodes.push(ctor);
            }
            else {
                newNodes.push({
                    "type": "FunctionDeclaration",
                    "id": {
                        "type": "Identifier",
                        "name": ctorVarName
                    },
                    "params": [],
                    "body": {
                        "type": "BlockStatement",
                        "body": []
                    }
                });
            }

            newNodes.push({
                "type": "ExpressionStatement",
                "expression": {
                    "type": "AssignmentExpression",
                    "operator": "=",
                    "left": {
                        "type": "MemberExpression",
                        "computed": false,
                        "object": {
                            "type": "Identifier",
                            "name": ctorVarName
                        },
                        "property": {
                            "type": "Identifier",
                            "name": "prototype"
                        }
                    },
                    "right": protoObject
                }
            });

            insertBefore(node, parent, newNodes);
            moduleExportsRight = {
                "type": "Identifier",
                "name": ctorVarName
            };
        }

        var moduleExportsNode = {
            "type": "ExpressionStatement",
            "expression": {
                "type": "AssignmentExpression",
                "operator": "=",
                "left": {
                    "type": "MemberExpression",
                    "computed": false,
                    "object": {
                        "type": "Identifier",
                        "name": "module"
                    },
                    "property": {
                        "type": "Identifier",
                        "name": "exports"
                    }
                },
                "right": moduleExportsRight
            }
        };

        var replacements = [moduleExportsNode];
        if (!isLast) {
            replacements.push({
                    "type": "ReturnStatement",
                    "argument": null
                });
        }

        replace(node, parent, replacements);
    }

    def.returnStatements.forEach(function(returnStatement, i) {
        fixReturnStatement(returnStatement.node, returnStatement.parent, i === def.returnStatements.length-1);
    });    
}

function fixSuperclass(def, ast) {
    
    var ctorVarName = def.exportsVarName;
    var target = def.returnStatements.length ? def.returnStatements[def.returnStatements.length - 1] : null;

    // console.log('def.superclass: ', ctorVarName, 'TARGET: ', target);

    if (ctorVarName && target) {
        var inheritStatement = {
            "type": "ExpressionStatement",
            "expression": {
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
                        "name": "inherit"
                    }
                },
                "arguments": [
                    {
                        "type": "Identifier",
                        "name": ctorVarName
                    },
                    {
                        "type": "CallExpression",
                        "callee": {
                            "type": "Identifier",
                            "name": "require"
                        },
                        "arguments": [
                            {
                                "type": "Literal",
                                "value": def.superclass,
                            }
                        ]
                    }
                ]
            }
        };

        insertBefore(target.node, target.parent, [inheritStatement]);

        // Walk the tree again to fix all references to the superclass
        estraverse.replace(target.parent, {
            enter: function(node, parent) {
                
            },

            leave: function(node, parent) {
                var finalParts = [];
                var shouldFix = true;
                var modified = false;

                if (node.type === 'ExpressionStatement' &&
                    node.expression.type === 'CallExpression') {

                    var callee = node.expression.callee;
                    
                    

                    if (callee.type === 'MemberExpression' &&
                        callee.object.type === 'MemberExpression') {
                        var idParts = idNodeToArray(callee);

                        // console.log("*****", idParts);
                        if (idParts && idParts.length) {
                            if (idParts[0] === ctorVarName) {
                                var i=0;

                                while (i<idParts.length) {
                                    var cur = idParts[i];
                                    var next = i+1<idParts.length ? idParts[i+1] : undefined;
                                    if (cur === 'superclass' && next) {
                                        if (next === 'constructor') {
                                            i++; // Skip past 'superclass'
                                            i++; // Skip past 'constructor'
                                            finalParts.push('$super');
                                            modified = true;
                                            continue;
                                        }
                                        else if (next !== 'call' && next !== 'apply') {
                                            i++; // Skip past 'superclass'
                                            i++; // Skip past 'constructor'
                                            finalParts.push('$super');
                                            finalParts.push('prototype');
                                            finalParts.push(next);
                                            modified = true;
                                            continue;
                                        }
                                    }
                                    else {
                                        finalParts.push(cur);
                                    }

                                    i++;
                                    continue;
                                    
                                }
                            }
                        }
                    }

                    if (modified) {
                        node.expression.callee = idArrayToNode(finalParts);
                    }
                    
                }
                
            }
        });
    }

    return ast;
}

function transformDef(def) {
    var parent = def.parent;

    

    if (def.superclass) {
        fixSuperclass(def);
    }

    // Fix return statements
    fixReturnStatements(def);

    if (def.isAssignment === false) {
        replace(def.node, parent, def.factoryFunctionNode.body.body);

        parent.body = getDefineRequireNodes(def).concat(parent.body);
    }
}


function transformAST(ast) {
    var defs = [];
    var defStack = [];
    var def;

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {
            var curDef;

            if ((curDef = parseDefineNode(node))) {
                def = curDef;
                def.node = node;

                def.parent = parent;
                defs.push(def);
                defStack.push(def);
            }
            else if (def && node.type === 'FunctionExpression' && node !== def.factoryFunctionNode) {
                def.curLevel++;
            }

            if (def && node.type === '') {
                if (node.type === 'FunctionDeclaration') {
                    def.scope[node.id.name] = node;
                }
                else if (node.type === 'VariableDeclaration') {
                    node.declarations.forEach(function(decl) {
                        def.scope[decl.id.name] = decl.init;
                    });
                }
            }
        },

        leave: function(node, parent) {
            if (def && def.node === node) {
                defStack.pop();
                def = defStack.length ? defStack[defStack.length-1] : null;
            }
            else if (def && node.type === 'ReturnStatement') {
                if (def.curLevel === 0) {
                    if (node.argument.type === 'Identifier') {
                        def.exportsVarName = node.argument.name;
                    }

                    def.returnStatements.push({
                        node: node,
                        parent: parent
                    });


                }
            }
            else if (def && node.type === 'FunctionExpression') {
                def.curLevel--;
            }

            
        }
    });

    // Transform found define nodes
    defs.forEach(transformDef);

    // Fix top-level "use strict" (if found)
    fixUseStrict(ast);

    return ast;
}

exports.transformAST = transformAST;