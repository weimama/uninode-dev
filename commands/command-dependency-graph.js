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

function printGraph(moduleNodes, depth) {
    for (var i = 0; i < moduleNodes.length; i++) {
        var moduleNode = moduleNodes[i];
        console.log(indent(moduleNode.name, depth));
        printGraph(moduleNode.dependencies, depth+1);
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

        args.dir = args._[0];
        args.org = args.org || 'raptorjs3';

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

        require('../lib/github.js').fetchRepos(org, function(err, repos) {

            if (err) {
                rapido.log.error('Error fetching ' + org + ' repositories using GitHub API.', err);
                return;
            }

            var dirs = [];
            for (var i = 0; i < repos.length; i++) {
                var repoDir = path.join(reposDir, repos[i].name);
                dirs.push(repoDir);
            }

            var moduleNodes = require('../lib/dependencies.js').dependencyGraph(dirs);
            printGraph(moduleNodes, 0);
        });
    }
};
