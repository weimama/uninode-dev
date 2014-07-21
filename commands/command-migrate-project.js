'use strict';

require('raptor-polyfill');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var shell = require('shelljs');

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

module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

    options: {
        'skip-transform-require': {
            description: 'Skip transforming non-raptor module paths in calls to require() to relative paths',
            type: 'boolean',
            default: false
        },

        file: {
            description: 'Only transform a single file',
            type: 'string'
        },
        onlytemplate: {
            description: 'Skip transforming backendAPI',
            type: 'boolean',
            default: false
        },
        dest: {
            description: 'destination folder',
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

        // return;

        var hasDestProject = false;
        if(args.destProject) {
            hasDestProject = true;
        }
        args.destProject = args.destProject || path.resolve(args.sourceProject) + '-migrate';


        args.sourceProject = path.resolve(args.sourceProject);
        args.destProject = path.resolve(args.destProject);

        var file = args.destProject;

        var execDir = process.cwd();

        exec('mkdir -p ' + file);

        var migrateScriptDir = path.resolve(execDir, 'migrate-cubejs/migrate-fe-collections');

        if(! require('fs').existsSync(migrateScriptDir) ) {
            exec('rm -rf migrate-cubejs');
            exec('git clone https://github.paypal.com/psteeleidem/migrate-cubejs.git');
            exec('cd migrate-cubejs && npm install --registry http://npm.paypal.com/');
        }

        exec('cd migrate-cubejs/migrate-fe-collections && ./migrate.sh ' + args.sourceProject + ' ' + args.destProject);

        if(args.onlyTemplate) {
            return;
        }


        if(!file) {
            file = args.sourceProject;
        }


        // var path = require('path');
        var projectDir = file;
        var projectSrcDir = path.resolve(file, './src');
        var componentsDir = path.resolve(file, './src/ui/components');
        var projectTestsDir = path.resolve(file, './tests');




        // console.log('cnt:', contentDir);
        if (fs.existsSync(projectDir) && fs.existsSync(projectSrcDir) ) {

            var r ;
            var cmd = '';


            // console.log('---: Migrate ebay 4cb content file to Property file');
            // r = shell.exec('raptor-dev migrate ecbcontent ' + projectDir);
            // console.log('---: Migrate AMD module to CommonsJS module');
            // r = shell.exec('raptor-dev migrate javascript ' + projectSrcDir);
            // console.log('---: Migrate from package.json to optimizer.json');
            // r = shell.exec('raptor-dev migrate packages ' + projectSrcDir);
            // console.log('---: Migrate RTLD files to raptor-taglib.json');
            // r = shell.exec('raptor-dev migrate taglibs ' + projectSrcDir);
            // console.log('---: Migrate Raptor Template files from XML(raptorjs2) to HTML(raptorjs3)');
            // r = shell.exec('raptor-dev migrate templates ' + projectSrcDir);
            // console.log('---: Migrate UI components to the RaptorJS 3 style');
            // r = shell.exec('raptor-dev migrate components ' + componentsDir);
            // console.log('---: Migrate inline javascript to widget');
            // r = shell.exec('raptor-dev migrate inlinescript ' + projectSrcDir);
            var exampleProDir = path.resolve(__dirname, '../project');
            // console.log('---exampleProDir:', exampleProDir);
            exec('mkdir -p ' + projectSrcDir+'/migrate');


            exec('uninode-dev migrate templatepatch ' + projectSrcDir);
            // return;

            exec('uninode-dev migrate cleanmiddleware ' + projectSrcDir);
            exec('uninode-dev migrate render ' + projectSrcDir);
            exec('uninode-dev migrate uniapi ' + projectSrcDir);

            cmd = 'cp -rf '+exampleProDir + '/src/migrate/* ' + ' ' + projectSrcDir + '/migrate';
            exec(cmd);
            exec('cp ' + exampleProDir + '/index.js' + ' ' + projectDir + '/');
            exec('cp ' + exampleProDir + '/package.json' + ' ' + projectDir + '/');
            exec('cp ' + exampleProDir + '/config/config.json' + ' ' + projectDir + '/config/');

            console.log('All files migrated to Unified Stack files.');
        } else {
            console.log('Project Dir or Project/src Dir does not exist');
        }





    }
};
