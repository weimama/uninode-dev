'use strict';

var fs = require('fs');
var async = require('../lib/async');
var path = require('path');

function trim(str) {
    return str ? str.trim() : str;
}

function runGitCommand(gitArgs, dir, logger, callback) {
    var spawn = require('child_process').spawn;

    var git = spawn('git', gitArgs, {
        cwd: dir
    });

    //git.stdout.setEncoding('utf8');
    //git.stderr.setEncoding('utf8');

    var err;

    // pipe stdout to our own console
    git.stdout.on('data', function (data) {
        process.stdout.write(data);
    });

    // pipe stderr to our own console
    git.stderr.on('data', function (data) {
        process.stderr.write(data);
        err = 'Errors occurred for command "git ' + gitArgs.join(' ') + '".';
    });

    // catch errors
    git.on('error', function(err) {
        callback(err);
    });

    git.on('close', function (code) {
        callback(err);
    });
}

module.exports = {
    /**
     * Tell the OS to run the "git" command with the given arguments and in the given directory
     */
    runGitCommand: runGitCommand,

    updateRepos: function(repos, dir, logger, callback) {
        var raptorModuleDirs = [];

        var errors = [];

        var createGitJob = function(repo) {
            var repoDir = path.join(dir, repo.name);
            raptorModuleDirs.push(repoDir);

            return function(callback) {

                var onGitCommandComplete = function(err) {
                    if (err) {
                        errors.push('Unabl');
                    }
                    callback();
                };

                if (fs.existsSync(repoDir)) {
                    logger.info('Updating ' + repo.name + '...');
                    runGitCommand(['pull', '-u'], repoDir, logger, onGitCommandComplete);
                } else {
                    logger.info('Cloning ' + repo.name + '...');
                    runGitCommand(['clone', repo.clone_url], dir, logger, onGitCommandComplete);
                }
            };
        };

        var gitWork = [];
        for (var i = 0; i < repos.length; i++) {
            var repo = repos[i];
            gitWork.push(createGitJob(repo));
        }

        async.series(gitWork, callback);
    }
};