'use strict';

var path = require('path');
var git = require('../lib/git');
var npm = require('../lib/npm');


function runSetup(args, logger) {
    var org = require('../lib/raptorjs-github-org');

    logger.info('Repositories for ' + org + ' will be cloned to ' + args.dir);

    // STEP 1: Find all of the RaptorJS repos on GitHub
    require('../lib/github').fetchRepos(org, function(err, repos) {
        if (err) {
            logger.error('Error fetching GitHub repositories.', err);
            process.exit(1);
            return;
        }

        var dir = args.dir;
        var i;
        var repo;

        logger.info('Found the following ' + org + ' repositories on GitHub:');
        for (i = 0; i < repos.length; i++) {
            repo = repos[i];
            logger.info(repo.name);
        }

        logger.info('Cloning or updating raptorjs repositories to ' + dir + '...');

        // STEP 2: Run "git clone" or "git pull -u" for each repo
        git.updateRepos(repos, args.dir, logger, function(err) {
            if (err) {
                logger.error('Error cloning one or more repos.');
                return;
            }

            logger.info('All raptorjs repositories cloned or updated successfully.');

            if (args.link !== false) {
                // STEP 3: Use "npm link" to link all of the modules for development
                npm.linkModules(repos, args.dir, logger, function(err) {

                    if (err) {
                        logger.error('Error linking modules.', err);
                        return;
                    }

                    logger.info('All raptorjs modules linked successfully.');
                });
            }
        });
    });
}
module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

    options: {
        'org': {
            'description': 'GitHub organization',
            'default': require('../lib/raptorjs-github-org')
        },
        'link': {
            'description': 'Disable/enable npm link of modules',
            type: 'boolean',
            default: true
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

        var logger = rapido.log;

        logger.info('GitHub organization: ' + org);

        var prompt = rapido.prompt;
        prompt.start();
        prompt.get({
            properties: {
                dir: {
                    name: 'dir',
                    description: 'Enter location for ' + org + ' repositories',
                    default: args.dir
                }
            }
        }, function(err, result) {
            if (err) {
                logger.error(err);
                return;
            }
            
            args.dir = path.resolve(result.dir);
            runSetup(args, rapido.log);
        });
    }
};