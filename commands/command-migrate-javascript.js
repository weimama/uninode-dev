'use strict';

require('raptor-ecma/es6');
var nodePath = require('path');
var jsTransformer = require('../lib/js-transformer');
var fs = require('fs');

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
        var dir = args._[0];
        if (dir) {
            dir = nodePath.resolve(process.cwd(), dir);
        }
        else {
            dir = process.cwd();
        }

        var file = args.file;
        if (file) {
            file = nodePath.resolve(process.cwd(), file);
        }
        
        return {
            dir: dir,
            searchPath: [dir],
            file: file,

            skipTransformRequire: args['skip-transform-require']
        };
    },

    run: function(args, config, rapido) {
        var dir = args.dir;

        console.log('--------------');
        console.log('Configuration:');
        for (var key in args) {
            console.log(key + ': ' + args[key]);
        }
        console.log('--------------');

        function transformFile(file) {
            var src = fs.readFileSync(file, {encoding: 'utf8'});
            console.log('Transforming ' + file + '...');
            args.from = nodePath.dirname(file);
            var transformed = jsTransformer.transform(src, args);


            fs.writeFileSync(file, transformed, {encoding: 'utf8'});
        }

        if (args.file) {
            transformFile(args.file);
        }
        else {
            require('raptor-files/walker').walk(
                dir,
                function(file) {

                    if (file.isDirectory()) {
                        return;
                    }
                    
                    if (!file.getName().endsWith('.js')) {
                        return;
                    }

                    transformFile(file.getAbsolutePath());
                },
                this);
        }
    }
};
