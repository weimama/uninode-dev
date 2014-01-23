'use strict';

require('raptor-ecma/es6');
var nodePath = require('path');
var jsTransformer = require('../lib/js-transformer');
var fs = require('fs');

module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

    options: {
        file: {
            description: "Only transform a single file",
            type: "string"
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
            file: file
        };
    },

    run: function(args, config, rapido) {
        var dir = args.dir;

        var transformOptions = {
            searchPath: [dir]
        };

        function transformFile(file) {
            var src = fs.readFileSync(file, {encoding: 'utf8'});
            console.log('Transforming ' + file + '...');
            transformOptions.from = nodePath.dirname(file);
            var transformed = jsTransformer.transform(src, transformOptions);
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
