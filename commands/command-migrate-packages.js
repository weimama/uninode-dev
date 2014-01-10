'use strict';

require('raptor-ecma/es6');

var nodePath = require('path');
var fs = require('fs');
var packageTransformer = require('../lib/package-transformer');
var File = require('raptor-files/File');

function readJsonFile(path) {
    var json = fs.readFileSync(path, {encoding: 'utf8'});
    return JSON.parse(json);
}

function writeJsonFile(path, pkg) {
    var json = JSON.stringify(pkg, null, 4);
    fs.writeFileSync(path, json, {encoding: 'utf8'});
}

function isEmpty(o) {
    for (var k in o) {
        if (o.hasOwnProperty(k)) {
            return false;
        }
    }
    return true;
}

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

        require('raptor-files/walker').walk(
            dir,
            function(file) {

                if (file.isDirectory()) {
                    return;
                }
                
                if (file.getName() !== 'package.json' &&
                    !file.getName().endsWith('-package.json') &&
                    file.getName() !== 'optimizer.json' &&
                    !file.getName().endsWith('-optimizer.json')) {
                    return;
                }

                var pkg;
                try {
                    pkg = readJsonFile(file.getAbsolutePath());
                }
                catch(e) {
                    rapido.log.error('WARN', 'Unable to parse JSON file at path "' + file.getAbsolutePath() + '". Skipping!');
                    return;
                }
                
                
                var isOptimizerManifest = pkg.raptor ||
                    pkg['raptor-optimizer'] ||
                    Array.isArray(pkg.dependencies) ||
                    Array.isArray(pkg.includes) ||
                    pkg.extensions;

                if (isOptimizerManifest) {
                    rapido.log.info('Migrating "' + file.getAbsolutePath() + '"...');
                    var transformedPkg = packageTransformer.transform(pkg);
                    
                    var outputName;

                    if (file.getName().endsWith('-package.json')) {
                        outputName = file.getName().slice(0, 0-'-package.json'.length) + '-optimizer.json';
                    }
                    else if (file.getName() === 'package.json') {
                        outputName = 'optimizer.json';
                    }
                    else {
                        outputName = file.getName();
                    }

                    var outputFile = new File(file.getParent(), outputName);
                    var alreadyExists = outputFile.exists();

                    writeJsonFile(outputFile.getAbsolutePath(), transformedPkg);

                    if (alreadyExists) {
                        rapido.log.info('updated', outputFile.getAbsolutePath());
                    }
                    else {
                        rapido.log.info('added', outputFile.getAbsolutePath());
                    }

                    if (outputFile.getAbsolutePath() !== file.getAbsolutePath()) {
                        delete pkg.raptor;
                        delete pkg['raptor-optimizer'];

                        if (Array.isArray(pkg.dependencies)) {
                            delete pkg.dependencies;
                        }

                        delete pkg.extensions;

                        if (pkg.type === 'raptor-module') {
                            pkg = {}; // Delete all of the metadata... not actually a Node.js module
                        }

                        if (isEmpty(pkg)) {
                            rapido.log.info('deleted', file.getAbsolutePath());
                            file.remove();
                        }
                        else {
                            rapido.log.info('updated', file.getAbsolutePath());
                            writeJsonFile(file.getAbsolutePath(), pkg);
                        }
                    }
                }
            },
            this);
    }
};
