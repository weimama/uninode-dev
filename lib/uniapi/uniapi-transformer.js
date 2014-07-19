'use strict';

var esprima = require('esprima');
var escodegen = require('escodegen');

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' , err);
});


function transform(src, options, moduleOptions) {
    var ast = esprima.parse(src, {
        raw: true,
        tokens: true,
        range: true,
        comment: true
    });

    escodegen.attachComments(ast, ast.comments, ast.tokens);
    ast = require('../var-transformer').transformAST(ast, options);

    Object.keys(moduleOptions.moduleNames).forEach(function(moduleName){
        try{
            var transformerName = './' + moduleName + '-transformer';
            ast = require(transformerName).transformAST(ast, options, moduleOptions);
        } catch(e) {
            console.log('Transform Error:' , e && e.stack || e);
        }
    });


    // ast = require('./amd-transformer').transformAST(ast, options);
    // ast = require('./old-raptor-transformer').transformAST(ast, options);
    // ast = require('./context-async-transformer').transformAST(ast, options);

    // if (options.skipTransformRequire !== true) {
    //     ast = require('./require-transformer').transformAST(ast, options);
    // }

    // ast = require('./require-raptor-transformer').transformAST(ast, options);

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

    var codegen = src;
    try{
        // console.log('Generate File:', moduleOptions.file);
        codegen = escodegen.generate(ast, codegenOptions);
    }catch(e) {
        // console.log(moduleOptions.file);
        console.log('Error in Code Gen',e);
    }
    return codegen;
}

exports.transform = transform;
