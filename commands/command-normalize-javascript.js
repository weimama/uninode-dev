'use strict';
require('raptor-polyfill');
var esprima = require('esprima');
var escodegen = require('escodegen');
var walk = require('../lib/walk');

module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

    options: {
    },

    validate: function(args, rapido) {
        var files = args._;
        if (!files || !files.length) {
            throw 'one or more files is required';
        }
        
        return {
            files: files
        };
    },

    run: function(args, config, rapido) {


        var files = args.files;

        function transformFile(file) {


            var src = file.readAsString();

            var ast = esprima.parse(src, {
                raw: true,
                tokens: true,
                range: true,
                comment: true
            });

            escodegen.attachComments(ast, ast.comments, ast.tokens);

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

            var transformed = escodegen.generate(ast, codegenOptions);
            file.writeAsString(transformed);
        }

        walk(
            files,
            {
                file: function(file) {

                    if (file.endsWith('.js')) {
                        transformFile(file);
                    }
                }
            },
            function(err) {
                if (err) {
                    console.error('Error while migrating JavaScript: ' + (err.stack || err));
                    return;
                }
                
                console.log('All JavaScript files migrated to CommonJS');
            });
    }
};
