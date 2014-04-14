'use strict';

require('raptor-ecma/es6');
var nodePath = require('path');
var xmlTemplateTransformer = require('../lib/xml-template-transformer');
var removeNamespaces = require('../lib/template-remove-namespaces-transform');
var fs = require('fs');
var walk = require('../lib/walk');

module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

    options: {
        'rhtml-to-rxml': {
            description: 'Rename rhtml extension to rxml to maintain XML parsing',
            type: 'boolean'
        }
    },

    validate: function(args, rapido) {
        var files = args._;
        if (!files || !files.length) {
            throw 'one or more files is required';
        }
        
        return {
            rhtmlToRxml: args['rhtml-to-rxml'] === true,
            files: files
        };

    },

    run: function(args, config, rapido) {

        console.log('--------------');
        console.log('Configuration:');
        for (var key in args) {
            console.log(key + ': ' + args[key]);
        }
        console.log('--------------');

        function transformFile(file) {
            var src = fs.readFileSync(file, {encoding: 'utf8'});
            console.log('Transforming ' + file + '...');
            var transformed = src;

            if (!file.endsWith('.rxml')) {
                transformed = xmlTemplateTransformer.transform(src);
            }

            transformed = removeNamespaces(transformed);
            if (src !== transformed) {
                fs.writeFileSync(file, transformed, {encoding: 'utf8'});    
            }
        }

        var files = args.files;

        walk(
            files,
            {
                file: function(file) {

                    var basename = nodePath.basename(file);

                    if (args.rhtmlToRxml) {
                        if (!basename.endsWith('.rhtml') && basename.indexOf('.rhtml.') === -1) {
                            return;
                        }

                        var newName = file.getName().replace(/\.rhtml$/g, '.rxml').replace(/\.rhtml\./g, '.rxml.');
                        var newFile = nodePath.join(file.getParent(), newName);
                        console.log('Moving "' + file + '" to "' + newFile + '"...');
                        fs.writeFileSync(newFile, file.readAsString(), {encoding: 'utf8'});
                        file.remove(); // Remove the old file
                        console.log('Done');
                    }
                    else {
                        if (basename.endsWith('.rhtml') || basename.endsWith('.rxml')) {
                            transformFile(file);
                        }
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
