var esprima = require('esprima');
var escodegen = require('escodegen');

function transform(src) {
    var ast = esprima.parse(src, {
        raw: true,
        tokens: true,
        range: true,
        comment: true
    });

    escodegen.attachComments(ast, ast.comments, ast.tokens);
    ast = require('./var-transformer').transformAST(ast);
    ast = require('./amd-transformer').transformAST(ast);
    ast = require('./require-old-transformer').transformAST(ast);
    
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