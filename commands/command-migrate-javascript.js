'use strict';

require('raptor-ecma/es6');
var nodePath = require('path');
var jsTransformer = require('../lib/js-transformer');

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

        var transformOptions = {
            searchPath: dir
        };

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
                console.log('Transforming ' + file.getAbsolutePath() + '...');
                var transformed = jsTransformer.transform(src, transformOptions);
                file.writeAsString(transformed);
                // console.log("TRANSFORMED " + file.getAbsolutePath() + ":\n", transformed + '\n\n');
            },
            this);
    }
};
