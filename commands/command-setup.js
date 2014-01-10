'use strict';

var path = require('path');
//var fs = require('fs');
//var async = require('../lib/async.js');
var git = require('../lib/git.js');
var npm = require('../lib/npm.js');

module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

    options: {
        'org': {
            description: 'GitHub organization'
        }
    },

    validate: function(args, rapido) {
        args.org = args.org || 'raptorjs3';
        args.dir = args._[0];

        if (args.dir) {
            args.dir = path.resolve(process.cwd(), args.dir);
        } else {
            args.dir = process.cwd();
        }

        return args;
    },

    run: function(args, config, rapido) {
        var org = args.org;

        rapido.log.info('GitHub organization: ' + org);

        // Step 1: Find all of the RaptorJS repos on GitHub
        require('../lib/github.js').fetchRepos(org, function(err, repos) {
            if (err) {
                rapido.log.error('Error fetching GitHub repositories.', err);
                process.exit(1);
                return;
            }

            var dir = args.dir;
            var i;
            var repo;

            rapido.log.info('Found the following ' + org + ' repositories on GitHub:');
            for (i = 0; i < repos.length; i++) {
                repo = repos[i];
                rapido.log.info(repo.name);
            }

            rapido.log.info('Cloning or updating raptorjs repositories to ' + dir + '...');

            // Step 2: Run "git clone" or "git pull -u" for each repo
            git.updateRepos(repos, args.dir, rapido.log, function(err) {
                if (err) {
                    rapido.log.error('Error cloning one or more repos.');
                    return;
                }

                rapido.log.info('All raptorjs repositories cloned or updated successfully.');

                // Step 3:
            });
        });
    }
};