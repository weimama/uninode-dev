'use strict';

require('raptor-polyfill');
var nodePath = require('path');
var jsTransformer = require('../lib/js-transformer');
var fs = require('fs');
var walk = require('../lib/walk');

module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

    options: {
        'skip-transform-require': {
            description: 'Skip transforming non-raptor module paths in calls to require() to relative paths',
            type: 'boolean',
            default: false
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

        function transformFile(file) {
            if (/^jquery/.test(nodePath.basename(file))) {
                // Don't bother transforming jquery and jquery plugins
                return;
            }

            var src = fs.readFileSync(file, {encoding: 'utf8'});
            console.log('Transforming ' + file + '...');
            args.from = nodePath.dirname(file);
            var transformed = jsTransformer.transform(src, args);
            fs.writeFileSync(file, transformed, {encoding: 'utf8'});
        }

        console.log('Transforming files in the following directories: ' + files.join(', '));

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
