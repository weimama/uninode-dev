'use strict';

var async = require('raptor-async');
var fs = require('fs');
var path = require('path');
var npm = require('../lib/npm.js');

module.exports = {
    usage: 'Usage: $0 $commandName [module1 module2 ... moduleX]',

    options: {},

    validate: function(args, rapido) {
        args.modules = args._;
        return args;
    },

    run: function(args, config, rapido) {

        var packageFilePath = path.normalize('./package.json');
        var packageObj;

        try {
            packageObj = JSON.parse(fs.readFileSync(packageFilePath));

        } catch(err) {
            rapido.log.error('Error reading ' + packageFilePath, err);
        }

        var org = require('../lib/raptorjs-github-org');

        require('../lib/github').fetchRepos(org, function(err, repos) {

            if (err) {
                rapido.log.error('Error fetching ' + org + ' repositories using GitHub API.', err);
                return;
            }

            var repoByName = {};

            for (var i = 0; i < repos.length; i++) {
                var repo = repos[i];
                repoByName[repo.name] = repo;
            }

            var dir = process.cwd();
            var work = [];

            for (var moduleName in packageObj.dependencies) {
                if (repoByName[moduleName]) {
                    try {
                        fs.rmdirSync(path.join(dir, 'node_modules', moduleName));
                    } catch(err) {
                        // ignore
                    }

                    work.push(npm.createNpmLinkModuleJob(moduleName, dir, rapido.log));
                }
            }

            async.parallel(work, function(err, results) {
                if (err) {
                    rapido.log.error('Errors occurred.', err);
                    return;
                }

                rapido.log.success('All ' + org + ' modules linked.');
            });
        });
    }
};
