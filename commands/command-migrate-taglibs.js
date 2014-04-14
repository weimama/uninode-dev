var xmlTransformer = require('../lib/taglib-xml-transformer');
var jsonTransformer = require('../lib/taglib-json-transformer');
var nodePath = require('path');
var fs = require('fs');
var walk = require('../lib/walk');

require('raptor-ecma/es6');

module.exports = {
    usage: 'Usage: $0 $commandName <file>',

    options: {
        
    },

    validate: function(args, rapido) {
        var files = args._;
        if (!files || !files.length) {
            throw 'one or more files is required';
        }
        
        return {
            files: files
        };
    },

    run: function(args, config, rapido) {
        var files = args.files;

        walk(
            files,
            {
                file: function(file) {

                    var taglib;
                    
                    var dirname = nodePath.dirname(file);
                    var outputFile = nodePath.join(dirname, 'raptor-taglib.json');

                    try {
                        if (file.endsWith('.rtld')) {
                            taglib = xmlTransformer.transform(file);

                            if (fs.existsSync(outputFile)) {
                                return;
                            }
                        } else if (file.endsWith('raptor-taglib.json')) {
                            taglib = jsonTransformer.transform(file);
                        } else {
                            return;
                        }

                        

                        fs.writeFileSync(outputFile, JSON.stringify(taglib, null, 4), 'utf8');
                        console.log('Migrated "' + rapido.relativePath(file) + '" to "' + rapido.relativePath(outputFile) + '"');
                    } catch(e) {
                        console.error('Unable to migrate "' + rapido.relativePath(file) + '". Error: ' + (e.stack || e));
                    }
                    
                }
            },
            function(err) {
                if (err) {
                    console.error('Error while migrating taglibs: ' + (err.stack || err));
                    return;
                }
                console.log('All taglibs migrated');
            });
        
        
    }
};
