var walk = require('../lib/walk');
var optimizerFixRelativePaths = require('../lib/optimizerFixRelativePaths');

var nodePath = require('path');
var fs = require('fs');
require('raptor-polyfill');

var mkdirp = require('mkdirp');
var raptorAsync = require('raptor-async');

module.exports = {
    usage: 'Usage: $0 $commandName <from-dir> <to-dir> --update-dir <update-dir>',

    options: {
        'update-dir': {
            description: 'The directory to scan for paths that need to be updated',
            type: 'string'
        }
    },

    validate: function(args, rapido) {
        var dirs = args._;
        if (!dirs || dirs.length !== 2) {
            throw '"from" and "to" directory must be specified';
        }

        var updateDir = args['update-dir'];
        
        return {
            fromDir: dirs[0],
            toDir: dirs[1],
            updateDir: updateDir || process.cwd()
        };
    },

    run: function(args, config, rapido) {
        var fromDir = args.fromDir;
        var toDir = args.toDir;
        var updateDir = args.updateDir;

        mkdirp.sync(toDir);

        fs.renameSync(fromDir, toDir);
        
        console.log('Updating relative paths in dir "' + updateDir + '"...');
        walk(
            updateDir,
            {
                file: function(file) {

                    var basename = nodePath.basename(file);
                    if (basename.endsWith('optimizer.json')) {
                        console.log('Updating relative paths in "' + file + '"...');
                        var optimizerManifest = JSON.parse(fs.readFileSync(file, 'utf8'));
                        optimizerManifest = optimizerFixRelativePaths(optimizerManifest, file, fromDir, toDir); 
                        fs.writeFileSync(file, JSON.stringify(optimizerManifest, null, 4), 'utf8');
                    }
                }
            },
            function() {
                console.log('Directory moved and all relative paths updated');
            });
        
    }
};
