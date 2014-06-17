'use strict';

require('raptor-polyfill/string/startsWith');
var File = require('raptor-files/File');

var nodePath = require('path');

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

        dir = new File(dir);

        var children = dir.listFiles();

        for (var i=0; i<children.length; i++) {
            var childDir = children[i];
            if (childDir.getName().startsWith('raptor-') || childDir.getName() === 'rapido') {
                var gitDir = new File(childDir, '.git');
                if (gitDir.exists()) {
                    var nodeModulesDir = new File(childDir, 'node_modules');
                    if (nodeModulesDir.exists()) {
                        console.log('Removing: ' + nodeModulesDir);
                        nodeModulesDir.remove();
                    }
                }
            }
        }
    }
};
