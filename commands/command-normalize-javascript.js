'use strict';

require('raptor-ecma/es6');

var nodePath = require('path');
var esprima = require('esprima');
var escodegen = require('escodegen');

module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

    options: {
    },

    validate: function(args, rapido) {
        var dir = args._[0];
        if (dir) {
            dir = nodePath.resolve(process.cwd(), dir);
        }
        else {
            dir = process.cwd();
        }
        
        return {
            dir: dir
        };
    },

    run: function(args, config, rapido) {
        var dir = args.dir;

        require('raptor-files/walker').walk(
            dir,
            function(file) {

                if (file.isDirectory()) {
                    return;
                }
                
                if (!file.getName().endsWith('.js')) {
                    return;
                }

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
            },
            this);
    }
};
