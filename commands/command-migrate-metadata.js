'use strict';

require('raptor-polyfill');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var shell = require('shelljs');
var xml2js = require('xml2js');
var parser = new xml2js.Parser({
    mergeAttrs: true,
    explicitArray: false,
    charkey: '$t'
});


function exec(cmd) {
    // if(cmd && cmd.indexOf('uninode-dev') === -1) {
    //     return;
    // }

    console.log(cmd);
    // return;
    var r = shell.exec(cmd);
    if(r && r.code !== 0) {
        console.log(r);
    }
    return r;
}

function transformFile(file) {
    if(!file || !fs.existsSync(file)) {
        return;
    }

    var src = fs.readFileSync(file, {
        encoding: 'utf8'
    });


    console.log('Transforming ' + file + '...');

    var targetFile = file + '.json';
    targetFile = targetFile.replace('.xml.json','.json');

    parser.parseString(src, function (err, data) {
                // callback(err, data);
                if(err) {
                    console.log(err);
                    return;
                }
                // console.log(data);
                fs.writeFileSync(targetFile , JSON.stringify(data,null, 4), {
                    encoding: 'utf8'
                });
        });


};


module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

    options: {

        file: {
            description: 'Only transform a single file',
            type: 'string'
        }
    },

    validate: function(args, rapido) {
        var files = args._;

        if (!files || !files.length) {
            files = [process.cwd()];
        }

        var searchPath = files.filter(function(filePath) {
            var stat = fs.statSync(filePath);
            return stat.isDirectory();
        });

        var sourceProjectDir = files[0];


        return {
            searchPath: searchPath,
            files: files,
            skipTransformRequire: args['skip-transform-require'],
            sourceProject: sourceProjectDir,
            onlyTemplate: args['onlytemplate'],
            destProject: args['dest']
        };
    },


    run: function(args, config, rapido) {

        var files = args.files;
        var fileCount = 0;
        var moduleOptions = {};
        moduleOptions.moduleNames = {};
        // console.log(args);



        var file = files[0];
        // console.log(file);
        transformFile(file);

        return;



        // var path = require('path');
        var projectDir = file;
        var projectSrcDir = path.resolve(file, './src');
        var componentsDir = path.resolve(file, './src/ui/components');
        var projectTestsDir = path.resolve(file, './tests');




        // console.log('cnt:', contentDir);
        if (fs.existsSync(projectDir) && fs.existsSync(projectSrcDir) ) {






            console.log('All files migrated to Unified Stack files.');
        } else {
            console.log('Project Dir or Project/src Dir does not exist');
        }





    }
};
