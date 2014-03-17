'use strict';

var https = require('https');
var url = require('url');

var linkRegex = /<([^\>]+)>; rel=\"next\"/;

function findNext(response) {
    var linkHeader = response.headers['link'];
    if (!linkHeader) {
        return null;
    }

    var match = linkRegex.exec(linkHeader);
    return match && match[1];
}

function fetchPage(githubUrl, callback) {

    var urlObj = url.parse(githubUrl);

    var requestOptions = {
        host: 'api.github.com',
        port: 443,
        path: urlObj.path,
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

            callback(null, JSON.parse(dataStr), findNext(response));
        });
    });

    // send the request
    request.end();
}

module.exports = {
    fetchRepos: function(org, callback) {
        var url = 'https://api.github.com/orgs/' + org + '/repos';

        var result = [];

        function onFetchPage(err, data, next) {
            if (err) {
                return callback(err);
            }
            
            result = result.concat(data);

            if (next) {
                fetchPage(next, onFetchPage);
            } else {
                callback(null, result);
            }
        }

        fetchPage(url, onFetchPage);
    }
};
