require('raptor-polyfill');
var nodePath = require('path');
var fs = require('fs');
var walk = require('../lib/walk');
var beautify = require('js-beautify').html;

module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

    options: {
        'rhtml-to-rxml': {
            description: 'Rename rhtml extension to rxml to maintain XML parsing',
            type: 'boolean'
        },
        'root-dir': {
            description: 'The root directory to resolve "absolute" paths relative to',
            type: 'string'
        }
    },

    validate: function(args, rapido) {
        var files = args._;
        if (!files || !files.length) {
            throw 'one or more files is required';
        }

        var rootDir = args['root-dir'];

        if (rootDir) {
            rootDir = nodePath.resolve(process.cwd(), rootDir);
        } else {
            rootDir = process.cwd();
        }

        return {
            rhtmlToRxml: args['rhtml-to-rxml'] === true,
            files: files,
            rootDir: rootDir
        };

    },



    run: function(args, config, rapido) {
        var rootDir = args.rootDir;


        function transformFile(file) {
            var src = fs.readFileSync(file, {encoding: 'utf8'});
            if(!src) {
                return;
            }

            if(!file.endsWith('.rhtml')) {
                return;
            }

            if( src.indexOf('<head>') === -1 && src.indexOf('<body>') === -1) {
                return;
            }

            console.log('Transforming ' + file + '...');

            var oriSrc = src;
            if(src.indexOf('<head>') !== -1) {
                if(src.indexOf('<gh-head-css\/>') === -1) {
                    src = src.replace(/<head>([\s\S]*?)<\/head>/mi, '<head>$1 <gh-head-css\/> <\/head>');
                }
                if(src.indexOf('<optimizer-head\/>') === -1) {
                    src = src.replace(/<head>([\s\S]*?)<\/head>/mi, '<head>$1 <optimizer-head\/> <\/head>');
                }
            }
            if(src.indexOf('<body>') !== -1) {
                if(src.indexOf('<gh-body-js\/>') === -1) {
                    src = src.replace(/<body>([\s\S]*?)<\/body>/mi, '<body>$1 <gh-body-js\/> <\/body>');
                }
                if(src.indexOf('<optimizer-body\/>') === -1) {
                    src = src.replace(/<body>([\s\S]*?)<\/body>/mi, '<body>$1 <optimizer-body\/> <\/body>');
                }
                if(src.indexOf('<tracking-helper var="tracking" \/>') === -1) {
                    src = src.replace(/<body>([\s\S]*?)<\/body>/mi, '<body> <tracking-helper var="tracking" \/> $1 <\/body>');
                }
            }

            if(src !== oriSrc) {

                src = beautify(src, {
                    wrap_line_length: 0,
                    preserve_newlines: true
                });

                fs.writeFileSync(file, src, {encoding: 'utf8'});
            }

        }

        var files = args.files;

        walk(
            files,
            {
                file: function(file) {

                    var basename = nodePath.basename(file);
                    if(!basename) {
                        return;
                    }

                    if (!basename.endsWith('.rhtml') ) {
                        return;
                    }

                    transformFile(file);



                }
            },
            function(err) {
                if (err) {
                    console.error('Error while migrating .rthml: ' + (err.stack || err));
                    return;
                }
                console.log('All .rhtml file has been patched with gh-js gh-css and tracking');
            });

    }
};
