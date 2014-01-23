var estraverse = require('estraverse');
var replace = require('./transform-util').replace;

function fixVarDeclaration(node, parent) {
    var declarations = node.declarations;

    if (parent.type === 'ForInStatement' || parent.type === 'ForStatement') {
        return;
    }

    //  || parent.type === 'SwitchCase'

    // console.log("FIX DECLARATION: ", JSON.stringify(node, null, '    '), '\nPARENT:\n', require('util').inspect(parent));


    var newNodes = [];
    declarations.forEach(function(decl) {
        // console.log("FIX DECLARATION: ", JSON.stringify(decl, null, '    '));
        if (decl.init && decl.init.type === 'FunctionExpression') {
            var funcDecl = decl.init;
            funcDecl.type = "FunctionDeclaration";
            funcDecl.id = decl.id;
            newNodes.push(funcDecl);
        }
        else {
            newNodes.push({
                "type": "VariableDeclaration",
                "declarations": [
                    {
                        "type": "VariableDeclarator",
                        "id": {
                            "type": "Identifier",
                            "name": decl.id.name
                        },
                        "init": decl.init
                    }
                ],
                "kind": node.kind
            });
        }
    });

    replace(node, parent, newNodes);
}

function transformAST(ast) {
    var varDeclarations = [];

    // console.log("FIX VAR: ", JSON.stringify(ast, null, '    '));

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {
            if (node.type === 'VariableDeclaration') {
                varDeclarations.push({
                    node: node,
                    parent: parent
                });
            }
        },

        leave: function(node, parent) {
            
        }
    });

    varDeclarations.forEach(function(varDeclaration) {
        fixVarDeclaration(varDeclaration.node, varDeclaration.parent);    
    });

    return ast;
}

exports.transformAST = transformAST;