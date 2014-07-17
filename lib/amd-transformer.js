var estraverse = require('estraverse');
var replace = require('./transform-util').replace;
var insertBefore = require('./transform-util').insertBefore;
var idNodeToArray = require('./transform-util').idNodeToArray;
var idArrayToNode = require('./transform-util').idArrayToNode;

function getDefineRequireNodes(def) {
    var requireNodes = def.dependencyNodes
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

    if (def.type === 'define.extend' && def.extendTargetVarName) {
        requireNodes.push({
                "type": "VariableDeclaration",
                "declarations": [
                    {
                        "type": "VariableDeclarator",
                        "id": {
                            "type": "Identifier",
                            "name": def.extendTargetVarName
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
                                    "value": def.extendTargetId
                                    // "raw": "'foo'"
                                }
                            ]
                        }
                    }
                ],
                "kind": "var"
            });
    }

    return requireNodes;
}

function parseCallExpression(expression) {
    if (expression.callee.type === 'Identifier' &&
        expression.callee.name === 'define') {
        return {
            type: 'define',
            args: expression.arguments
        };
    }

    if (expression.callee.type === 'MemberExpression' &&
        expression.callee.object.type === 'Identifier' &&
        expression.callee.object.name === 'define' && 
        expression.callee.property.type === 'Identifier') {

        if (expression.callee.property.name === 'Class') {
            return {
                type: 'define.Class',
                args: expression.arguments
            };    
        }
        else if (expression.callee.property.name === 'extend') {
            if (expression.arguments.length === 2 || expression.arguments.length === 3) {
                var targetVarName = null;

                var factoryFunction;
                var dependencyNodes;

                for (var i=1; i<expression.arguments.length; i++) {
                    var arg = expression.arguments[i];
                    if (arg.type === 'ArrayExpression') {
                        dependencyNodes = arg.elements;
                    }
                    else if (arg.type === 'FunctionExpression') {
                        factoryFunction = arg;
                    }
                }

                var targetParamIndex = dependencyNodes ? dependencyNodes.length + 1 : 1;


                if (factoryFunction.params[targetParamIndex]) {
                    targetVarName = factoryFunction.params[targetParamIndex].name;
                }
                
                return {
                    type: 'define.extend',
                    extendTargetId: expression.arguments[0].value,
                    extendTargetVarName: targetVarName,
                    factoryFunctionNode: factoryFunction,
                    dependencyNodes: dependencyNodes
                };
            }
            
        }
        
    }
}

function parseAssignmentExpression(expression) {
    if (expression.right && expression.right.type === 'CallExpression') {
        return parseCallExpression(expression.right);    
    }
}

function parseExpressionStatement(node) {
    var parsed;
    if (node.expression.type === 'CallExpression') {
        parsed = parseCallExpression(node.expression);

        if (parsed) {
            parsed.isAssignment = false;
        }    
    }
    else if (node.expression.type === 'AssignmentExpression') {
        parsed = parseAssignmentExpression(node.expression);

        if (parsed) {
            parsed.assignmentNode = node.expression;
            parsed.isAssignment = true;
        }
    }

    return parsed;
}

function parseVariableDeclarator(node) {
    var parsed;

    if (node.init && node.init.type === 'CallExpression') {
        parsed = parseCallExpression(node.init);

        if (parsed) {
            parsed.assignmentNode = node;
            parsed.isAssignment = true;
            return parsed;
        }
    }
}

function titleCase(str) {
    return str
        .replace(/^[a-z]/, function(match) {
            return match.toUpperCase();
        })
        .replace(/-([a-z])/g, function(match, c) {
            return c.toUpperCase();
        });
}

function parseDefineNode(node) {
    /* jshint loopfunc: true */
    var parsed = null;

    if (node.type === 'ExpressionStatement') {
        parsed = parseExpressionStatement(node);
    }
    else if (node.type === 'VariableDeclarator') {
        parsed = parseVariableDeclarator(node);
    }

    if (!parsed) {
        return null;
    }

    var args = parsed.args;

    parsed.returnStatements = [];
    parsed.moduleLoggerStatements = [];
    parsed.curLevel = 0;
    parsed.factoryFunctionParams = [];
    parsed.dependencyNodes = [];
    parsed.scope = {};
    parsed.getIdLastPart = function() {
        if (!this.id) {
            return null;
        }

        var parts = this.id.split('/');
        return parts[parts.length-1];
    };
    parsed.getCtorVarName = function() {
        return titleCase(this.exportsVarName || this.getIdLastPart() || 'Class');
    };



    if (args) {

        for (var i=0; i<args.length; i++) {
            var arg = args[i];
            if (arg.type === 'Literal') {
                if (parsed.id) {
                    parsed.superclass = arg;
                }
                else {
                    parsed.id = arg.value;    
                }
                
            }
            else if (arg.type === 'ObjectExpression') {
                if (i === args.length-1) {
                    // define('hello', { ... });
                    parsed.objectNode = arg;
                }
                else {
                    // define('hello', { superclass: 'super'}, ...);
                    arg.properties.forEach(function(prop) {
                        if (prop.key.name === 'superclass') {
                            parsed.superclass = prop.value;
                        }
                    });
                }
                
            }
            else if (arg.type === 'ArrayExpression') {
                parsed.dependencyNodes = arg.elements;
            }
            else if (arg.type === 'FunctionExpression') {
                parsed.factoryFunctionNode = arg;
                parsed.factoryFunctionParams = arg.params;
            }
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

function convertDefineClassObjectToCtorNodes(ctorVarName, protoObject) {
    var newNodes = [];
    var ctor = null;

    protoObject.properties = protoObject.properties.filter(function(prop) {
        if (prop.key.name === 'init') {
            ctor = prop.value;
            return false;
        }

        return true;
    });

    

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

    return newNodes;
}

function fixReturnStatements(def) {
    function fixReturnStatement(node, parent, isLast) {

        var returnArg = node.argument;
        if (!returnArg) {
            return;
        }

        var replacementNode = null;
        if (def.type === 'define.extend') {
            var extendTargetNode;
            if (def.extendTargetVarName) {
                extendTargetNode = {
                    "type": "Identifier",
                    "name": def.extendTargetVarName
                };
            }
            else {
                extendTargetNode = {
                    "type": "CallExpression",
                    "callee": {
                        "type": "Identifier",
                        "name": "require"
                    },
                    "arguments": [
                        {
                            "type": "Literal",
                            "value": def.extendTargetId
                        }
                    ]
                };
            }

            replacementNode = {
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
                            "name": "extend"
                        }
                    },
                    "arguments": [
                        extendTargetNode,
                        returnArg
                    ]
                }
            };
        }
        else if (def.type === 'define.Class' && node.argument.type === 'ObjectExpression') {
            

            // We need to convert the object to a constructor function and prototype
            var protoObject = node.argument;
            var ctorVarName = def.getCtorVarName();
            var newNodes = convertDefineClassObjectToCtorNodes(ctorVarName, protoObject);
            insertBefore(node, parent, newNodes);

            returnArg = {
                "type": "Identifier",
                "name": ctorVarName
            };
        }

        if (def.isAssignment) {
            node.argument = returnArg;
            replacementNode = node;
        }
        else if (def.type !== 'define.extend') {
            replacementNode = {
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
                    "right": returnArg
                }
            };
        }

        var replacements = [replacementNode];

        if (replacementNode.type !== 'ReturnStatement' && !isLast) {
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

function fixSuperclass(def) {
    
    var ctorVarName = def.getCtorVarName();
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
                    }
                ]
            }
        };

        if (def.superclass.type === 'Literal') {
            inheritStatement.expression.arguments.push({
                    "type": "CallExpression",
                    "callee": {
                        "type": "Identifier",
                        "name": "require"
                    },
                    "arguments": [
                        def.superclass
                    ]
                });
        }
        else {
            inheritStatement.expression.arguments.push(def.superclass);
        }

        insertBefore(target.node, target.parent, [inheritStatement]);

        // Walk the tree again to fix all references to the superclass
        estraverse.replace(target.parent, {
            enter: function(node, parent) {
                
            },

            leave: function(node, parent) {
                var finalParts = [];
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
}

function fixModuleLogger(def) {
    if (!def.moduleLoggerStatements.length) {
        return;
    }

    var newExpression = {
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
                        "value": "raptor-logging",
                        "raw": "'raptor-logging'"
                    }
                ]
            },
            "property": {
                "type": "Identifier",
                "name": "logger"
            }
        },
        "arguments": [
            {
                "type": "Identifier",
                "name": "module"
            }
        ]
    };

    for (var i=0; i<def.moduleLoggerStatements.length; i++) {
        var moduleLoggerStatement = def.moduleLoggerStatements[i];
        if (moduleLoggerStatement.type === 'VariableDeclarator') {
            moduleLoggerStatement.init = newExpression;
        }
    }
}

function transformDef(def) {
    var parent = def.parent;

    if (def.factoryFunctionNode) {
        def.factoryFunctionNode.body.body = getDefineRequireNodes(def).concat(def.factoryFunctionNode.body.body);
    }
    else if (def.objectNode) {
        insertBefore(def.node, def.parent, getDefineRequireNodes(def));
    }

    if (def.superclass) {
        fixSuperclass(def);
    }

    fixModuleLogger(def);

    if (def.factoryFunctionNode) {
        // Fix return statements by converting them to "module.exports"
        fixReturnStatements(def);
    }

    if (def.isAssignment) {
        var right = {
            "type": "CallExpression",
            "callee": {
                "type": "FunctionExpression",
                "id": null,
                "params": [],
                "defaults": [],
                "body": {
                    "type": "BlockStatement",
                    "body": def.factoryFunctionNode.body.body
                },
                "rest": null,
                "generator": false,
                "expression": false
            },
            "arguments": []
        };

        if (def.assignmentNode.type === 'AssignmentExpression') {
            def.assignmentNode.right = right;    
        }
        else if (def.assignmentNode.type === 'VariableDeclarator') {
            def.assignmentNode.init = right;       
        }
        else {
            throw new Error('Invalid assignmentNode');
        }
        
    }
    else if (def.objectNode) {
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
                "right": def.objectNode
            }
        };

        replace(def.node, parent, [moduleExportsNode]);
    }
    else if (def.factoryFunctionNode) {

        // Just replace the define/define.Class with the body of the factory function
        var replacementNodes = def.factoryFunctionNode.body.body;
        replace(def.node, parent, replacementNodes);
    }
    
}

function checkModuleLogger(def, node, parent) {
    if (!def) {
        return;
    }

    if (node.type === 'VariableDeclarator') {
        if (node.init && node.init.type === 'CallExpression') {
            var callee = node.init.callee;

            if (callee.type === 'MemberExpression' && 
                callee.computed === false &&
                callee.object.type === 'Identifier' &&
                callee.object.name === 'module' &&
                callee.property.type === 'Identifier' &&
                callee.property.name === 'logger') {
                
                def.moduleLoggerStatements.push(node);
            }
        }
    }
    
}

function transformAST(ast) {
    var defs = [];
    var defStack = [];
    var def;

    function checkNode(node, parent) {
        var curDef;

        if ((curDef = parseDefineNode(node))) {
            def = curDef;
            def.node = node;

            def.parent = parent;
            defs.push(def);
            defStack.push(def);
        }
        else if (def && (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') && node !== def.factoryFunctionNode) {
            def.curLevel++;
        }

        checkModuleLogger(def, node, parent);
        

        if (def) {
            if (node.type === 'FunctionDeclaration') {
                def.scope[node.id.name] = node;
            }
            else if (node.type === 'VariableDeclarator') {
                def.scope[node.id.name] = node.init;
            }
        }
    }

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {
            checkNode(node, parent);
        },

        leave: function(node, parent) {
            if (def && def.node === node) {
                defStack.pop();
                def = defStack.length ? defStack[defStack.length-1] : null;
            }
            else if (def && node.type === 'ReturnStatement') {
                if (def.curLevel === 0) {
                    if (node.argument && node.argument.type === 'Identifier') {
                        def.exportsVarName = node.argument.name;
                    }

                    def.returnStatements.push({
                        node: node,
                        parent: parent
                    });


                }
            }
            else if (def && (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration')) {
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