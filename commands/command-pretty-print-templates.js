'use strict';
require('raptor-polyfill');
var walk = require('../lib/walk');
var fs = require('fs');
var beautify = require('js-beautify').html;

module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

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

        function transformFile(file) {
            var src = fs.readFileSync(file, 'utf8');

            src = beautify(src, {
                wrap_line_length: 0,
                preserve_newlines: true
            });

            src = src.replace(/[\r\n](\s*[\r\n])+/gm, '\n\n');

            fs.writeFileSync(file, src, 'utf8');
        }

        walk(
            files,
            {
                file: function(file) {

                    if (file.endsWith('.rhtml')) {
                        transformFile(file);
                    }
                }
            },
            function(err) {
                if (err) {
                    console.error('Error while pretty printing templates: ' + (err.stack || err));
                    return;
                }
                
                console.log('All Raptor Templates have been pretty printed');
            });
    }
};
