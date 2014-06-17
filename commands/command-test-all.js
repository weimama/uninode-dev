'use strict';

require('raptor-polyfill');
var File = require('raptor-files/File');
var raptorPromises = require('raptor-promises');

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

        var modulesToPublish = [];
        var failedModules = {};
        var failed = false;

        for (var i=0; i<children.length; i++) {
            var childDir = children[i];
            if (childDir.getName() !== 'raptor-samples' && (childDir.getName().startsWith('raptor-') || childDir.getName() === 'rapido')) {
                var gitDir = new File(childDir, '.git');
                if (gitDir.exists()) {
                    modulesToPublish.push(childDir.getName());
                }
            }
        }

        modulesToPublish.sort();

        console.log('Testing the following modules:\n- ' + modulesToPublish.join('\n- '));

        var promises = modulesToPublish.map(function(moduleName) {
            var moduleDir = new File(dir, moduleName);
            var promise = rapido.runCommand('module', 'test', {
                    cwd: moduleDir.getAbsolutePath()
                });

            promise.fail(function(e) {
                failed = true;
                failedModules[moduleName] = e;
            });

            return promise;
        });

        return raptorPromises.all(promises)
            .then(function() {
                rapido.log();
                rapido.log.success('All test cases are passing!');
            })
            .fail(function() {
                var message = Object.keys(failedModules).sort().map(function(moduleName) {
                    return 'Module name: ' + moduleName + '\nReason: ' + failedModules[moduleName];
                }).join('\n\n');

                throw 'The following modules have failing tests:\n\n' + message;
            });
    }
};
