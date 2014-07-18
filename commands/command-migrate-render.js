'use strict';

require('raptor-polyfill');
var nodePath = require('path');
var fs = require('fs');
var _ = require('underscore');
var walk = require('../lib/walk');
var jsTransformer = require('../lib/uniapi/render-transformer');

module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

    options: {
        'skip-transform-require': {
            description: 'Skip transforming non-raptor module paths in calls to require() to relative paths',
            type: 'boolean',
            default: false
        },

        file: {
            description: 'Only transform a single file',
            type: 'string'
        }
    },

    validate: function(args, rapido) {
        var files = args._;
        if (!files || !files.length) {
            files = [process.cwd()];
        }

        var searchPath = files.filter(function(path) {
            var stat = fs.statSync(path);
            return stat.isDirectory();
        });


        return {
            searchPath: searchPath,
            files: files,
            skipTransformRequire: args['skip-transform-require']
        };
    },

    run: function(args, config, rapido) {
        var files = args.files;
        var count = 0;

        function hasRaptorJs2Render(src) {
            if(!src) return false;

            var hasJs2Render = false;
            if(src.indexOf('.dataProviders') !== -1) {
                hasJs2Render = true;
            }
            if(src.indexOf('.renderTemplate') !== -1) {
                hasJs2Render = true;
            }

            if(hasJs2Render) {
                var esprima = require('esprima');
                var ast = esprima.parse(src, {
                    raw: true,
                    tokens: true,
                    range: true,
                    comment: false
                });
                var hasToken = false;
                ast.tokens.forEach(function(token) {
                    if(token.value === 'dataProviders' || token.value === 'renderTemplate') {
                        hasToken = true;
                    }
                });
                //filter comments that contain dataProviders or renderTemplate
                if(hasToken) {
                    hasJs2Render = true;
                } else {
                    hasJs2Render = false;
                }
                // console.log(ast);
            }


            return hasJs2Render;
        }

        function transformFile(file) {

            var src = fs.readFileSync(file, {
                encoding: 'utf8'
            });
            if( ! hasRaptorJs2Render(src) ) {
                return;
            }

            console.log('Transforming ' + file + '...');
            count++;
            // return;
            var requireUnderscore = "var _ = require('underscore');";
            if(src.indexOf(requireUnderscore) === -1) {
                src = requireUnderscore + ' ' + src;
            }
            var viewModelDec = "var viewModel = {};";
            if(src.indexOf(viewModelDec) === -1) {
                src = viewModelDec + ' ' + src;
            }
            var templateFileDec = "var templateFile = null;";
            if(src.indexOf(templateFileDec) === -1) {
                src = templateFileDec + ' ' + src;
            }
            var templateDec = "var template = null;";
            if(src.indexOf(templateDec) === -1) {
                src = templateDec + ' ' + src;
            }

            // return;
            // args.from = nodePath.dirname(file);
            var transformed = jsTransformer.transform(src, args);
            fs.writeFileSync(file, transformed, {
                encoding: 'utf8'
            });
        }

        console.log('Transforming files in the following directories: ' + files
            .join(', '));

        walk(
            files, {
                file: function(file) {

                    if (file.endsWith('.js')) {
                        transformFile(file);
                    }
                }
            },
            function(err) {
                if (err) {
                    console.error('Error while migrating JavaScript: ' + (err.stack ||
                        err));
                    return;
                }

                console.log('All ' + count +' JavaScript files migrated to use render from RaptorJs3');
            });



    }
};
