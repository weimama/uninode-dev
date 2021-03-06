'use strict';
var ebayEp = require('experimentation-ebay');

module.exports.middleware = ebayEp.middleware;

module.exports.middleware.getQualifiedTreatments = function(options) {
    options = options || {};    

    return function(req, res, next) {
        ebayEp.addParams(options);
        next();
    }
};

module.exports.getEpContext = function(req) {
    var defer = require('q').defer();
    ebayEp.exp(null, function(err, exp) {
        if(err || !exp) {
            return defer.reject(err);
        }
        exp.hasFactor = exp.hasTreatmentsWithFactor;
        defer.resolve(exp);
    });
    return defer.promise;
};
