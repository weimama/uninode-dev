'use strict';

module.exports = {
    usage: 'Usage: $0 $commandName [org]',

    options: {},

    validate: function(args, rapido) {
        args.org = args._[0] || require('../lib/raptorjs-github-org');
        return args;
    },

    run: function(args, config, rapido) {

        var org = args.org;

        require('../lib/github').fetchRepos(org, function(err, repos) {

            if (err) {
                rapido.log.error('Error fetching ' + org + ' repositories using GitHub API.', err);
                return;
            }

            for (var i = 0; i < repos.length; i++) {
                console.log(repos[i].name);
            }
        });
    }
};
