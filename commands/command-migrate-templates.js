'use strict';

require('raptor-ecma/es6');
var nodePath = require('path');
var xmlTemplateTransformer = require('../lib/xml-template-transformer');
var fs = require('fs');

module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

    options: {
        file: {
            description: 'Only transform a single file',
            type: 'string'
        },
        'rhtml-to-rxml': {
            description: 'Rename rhtml extension to rxml to maintain XML parsing',
            type: 'boolean'
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
            file: file,
            rhtmlToRxml: args['rhtml-to-rxml'] === true
        };
    },

    run: function(args, config, rapido) {

        console.log('--------------');
        console.log('Configuration:');
        for (var key in args) {
            console.log(key + ': ' + args[key]);
        }
        console.log('--------------');
        
        var dir = args.dir;

        function transformFile(file) {
            var src = fs.readFileSync(file, {encoding: 'utf8'});
            console.log('Transforming ' + file + '...');
            var transformed = xmlTemplateTransformer.transform(src);
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
                    
                    if (args.rhtmlToRxml) {
                        if (!file.getName().endsWith('.rhtml') && file.getName().indexOf('.rhtml.') === -1) {
                            return;
                        }

                        var newName = file.getName().replace(/\.rhtml$/g, '.rxml').replace(/\.rhtml\./g, '.rxml.');
                        var newFile = nodePath.join(file.getParent(), newName);
                        console.log('Moving "' + file.getAbsolutePath() + '" to "' + newFile + '"...');
                        fs.writeFileSync(newFile, file.readAsString(), {encoding: 'utf8'});
                        file.remove(); // Remove the old file
                        console.log('Done');
                    }
                    else {
                        if (!file.getName().endsWith('.rhtml')) {
                            return;
                        }

                        transformFile(file.getAbsolutePath());
                    }
                },
                this);
        }
        
    }
};
