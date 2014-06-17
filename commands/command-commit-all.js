'use strict';

require('raptor-polyfill');
var File = require('raptor-files/File');
var raptorPromises = require('raptor-promises');

var nodePath = require('path');

module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

    options: {
        message: {
            description: 'Commit message',
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
        
        return {
            dir: dir,
            message: args.message
        };
    },


    run: function(args, config, rapido) {

        if (!args.message) {
            throw '--message is required';
        }

        var dir = args.dir;

        var children = new File(dir).listFiles();

        var logger = rapido.util.replayLogger();

        function spawnGit(args, options) {
            options = options || {};
            options.logger = logger;
            options.cwd = options.cwd;
            return rapido.util.spawnGit(args, options);
        }

        var modulesToCommit = [];

        for (var i=0; i<children.length; i++) {
            var childDir = children[i];
            var gitDir = new File(childDir, '.git');
            if (gitDir.exists()) {
                modulesToCommit.push(childDir.getName());
            }
        }

        modulesToCommit.sort();

        // modulesToCommit = ['raptor-async'];

        console.log('Committing changes in the following projects:\n- ' + modulesToCommit.join('\n- '));

        var promise = raptorPromises.makePromise();
        modulesToCommit.forEach(function(moduleName) {
            var cwd = nodePath.join(dir, moduleName);
            promise = promise
                .then(function() {
                    console.log('Adding all files "' + moduleName + '"...');
                    return spawnGit(['add', '-A', '.'], {cwd: cwd});
                })
                .then(
                    function resolved() {
                        return raptorPromises.makePromise()
                            .then(function() {
                                console.log('Committing changes for "' + moduleName + '"...');
                                return spawnGit(['commit', '-a', '-m', args.message], {cwd: cwd});    
                            })
                            .then(function() {
                                console.log('Committing changes for "' + moduleName + '"...');
                                return spawnGit(['push', 'origin', 'master'], {cwd: cwd});
                            });
                    },
                    function rejected() {
                        console.log('No changes to commit for "' + moduleName + '". Skipping...');
                    });

            return promise;
        });

        return promise.then(function() {

                rapido.log();
                rapido.log.success('All changes committer and pushed');
            });
    }
};
