var estraverse = require('estraverse');

function transformAST(ast) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {
                    },

        leave: function(node, parent) {
            if (node.type === 'CallExpression' &&
                node.arguments.length === 1 &&
                node.arguments[0].type === 'Literal') {
                
                var target = node.arguments[0].value;
                var targetParts = target.split('/');
                if (targetParts.length === 2 && targetParts[0] === 'raptor') {
                    if (targetParts[1] === 'templating') {
                        targetParts[1] = 'templates';
                    }
                    node.arguments[0].value = targetParts.join('-');
                }
                
            }

        }
    });

    return ast;
}

exports.transformAST = transformAST;