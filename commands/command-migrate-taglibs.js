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

        var foundRtldFiles = [];

        walk(
            files,
            {
                file: function(file) {

                    var taglib;
                    
                    var dirname = nodePath.dirname(file);
                    var outputFile = nodePath.join(dirname, 'raptor-taglib.json');

                    try {
                        if (file.endsWith('.rtld')) {
                            foundRtldFiles.push(file);

                            var importedPaths = [];
                            var prefix;

                            var options = {
                                onNamespace: function(namespace) {
                                    if (prefix == null || namespace.length < prefix) {
                                        prefix = namespace;
                                    }
                                },
                                importHandler: function(taglibPath) {
                                    importedPaths.push(taglibPath);
                                }
                            };



                            taglib = xmlTransformer.transform(file, options);

                            if (!prefix) {
                                return;
                            }

                            if (importedPaths.length) {
                                var tags = taglib.tags || (taglib.tags = {});

                                importedPaths.forEach(function(importPath) {
                                    var importedTaglib = xmlTransformer.transform(importPath, {
                                        prefix: prefix
                                    });

                                    var tagNames = Object.keys(importedTaglib.tags);
                                    var importedDirname = nodePath.dirname(importPath);

                                    if (tagNames.length === 1) {
                                        var importedTagName = tagNames[0];
                                        var tagDef = importedTaglib.tags[importedTagName];
                                        var tagFile = nodePath.join(importedDirname, 'raptor-tag.json');
                                        fs.writeFileSync(tagFile, JSON.stringify(tagDef, null, 4), 'utf8');
                                        tags[importedTagName] = nodePath.relative(dirname, tagFile);
                                    } else {
                                        tagNames.forEach(function(importedTagName) {
                                            var tagDef = importedTaglib.tags[importedTagName];
                                            var tagFile = nodePath.join(importedDirname, importedTagName + '.raptor-tag.json');
                                            fs.writeFileSync(tagFile, JSON.stringify(tagDef, null, 4), 'utf8');
                                            tags[importedTagName] = nodePath.relative(dirname, tagFile);
                                        });
                                    }
                                });  
                            }
                            // if (fs.existsSync(outputFile)) {
                            //     return;
                            // }
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

                foundRtldFiles.forEach(function(file) {
                    fs.unlinkSync(file);
                });
                
                console.log('All taglibs migrated');
            });
        
        
    }
};
