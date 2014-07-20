'use strict';
var ebayEp = require('experimentation-ebay');

module.exports.middleware = {};

module.exports.middleware.getQualifiedTreatments = function(options) {
    return function(req, res, next) {
        options = options || {};
        ebayEp..addParams(options);
        next();
    }
};

module.exports.getEpContext = function(req) {
    var defer = require('q').deferred();
    ebayEp.exp(req, null, function(err, exp) {
        if(err || !exp) {
            return defer.reject(err);
        }
        exp.hasFactor = exp.hasTreatmentsWithFactor;
        defer.resolve(exp);
    });
    return defer.promise;
};
