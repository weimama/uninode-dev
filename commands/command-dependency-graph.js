'use strict';

var path = require('path');

function indent(str, depth) {
    var result = new Array(depth + 1);
    for (var i = 0; i < depth; i++) {
        result[i] = '    ';
    }
    result[depth] = str;
    return result.join('');
}

function printGraph(moduleNodes, depth, dev) {
    for (var i = 0; i < moduleNodes.length; i++) {
        var moduleNode = moduleNodes[i];

        var dependencyName = dev ? moduleNode.name + ' (DEV)' : moduleNode.name;

        console.log(indent(dependencyName, depth));

        printGraph(moduleNode.dependencies, depth+1, dev);
        printGraph(moduleNode.devDependencies, depth+1, true);
    }
}

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

        var reposDir = args.dir;
        var org = args.org;

        require('../lib/github').fetchRepos(org, function(err, repos) {

            if (err) {
                rapido.log.error('Error fetching ' + org + ' repositories using GitHub API.', err);
                return;
            }

            var repoDirs = [];
            for (var i = 0; i < repos.length; i++) {
                var repoDir = path.join(reposDir, repos[i].name);
                repoDirs.push(repoDir);
            }

            var moduleNodes = require('../lib/dependencies').dependencyGraph(repoDirs);
            printGraph(moduleNodes, 0);
        });
    }
};
