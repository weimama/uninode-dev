'use strict';

require('raptor-polyfill');
var nodePath = require('path');
var fs = require('fs');
var _ = require('underscore');
var walk = require('../lib/walk');
var jsTransformer = require('../lib/uniapi/clean-middleware-transformer');

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

        function hasOldMiddleware(src) {
            if(!src) return false;

            if(src.indexOf('.middleware.pageName') !== -1) {
                return true;
            }
            if(src.indexOf('.middleware.tracking') !== -1) {
                return true;
            }
            if(src.indexOf('.middleware.getQualifiedTreatments') !== -1) {
                return true;
            }
            return false;
        }

        function transformFile(file) {

            var src = fs.readFileSync(file, {
                encoding: 'utf8'
            });
            if( ! hasOldMiddleware(src) ) {
                return;
            }

            console.log('Transforming ' + file + '...');
            count++;
            // return;

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
