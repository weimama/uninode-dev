'use strict';

var https = require('https');

module.exports = {
    fetchRepos: function(org, callback) {

        var requestOptions = {
            host: 'api.github.com',
            port: 443,
            path: '/orgs/' + org + '/repos',
            method: 'GET',
            headers: {
                // GitHub API requires User-Agent
                'User-Agent': 'raptor-dev setup'
            }
        };

        var chunks = [];

        var request = https.request(requestOptions, function(response) {

            response.setEncoding('utf8');

            response.on('error', function(err) {
                callback(err);
            });

            response.on('data', function(chunk) {
                chunks.push(chunk);
            });

            response.on('end', function() {
                var dataStr = chunks.join('');

                var contentType = response.headers['content-type'];
                if ((response.statusCode !== 200) || (contentType.indexOf('application/json')) === -1) {
                    return callback(dataStr);
                }

                callback(null, JSON.parse(dataStr));
            });
        });

        // send the request
        request.end();
    }
};