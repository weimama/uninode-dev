'use strict';
var moduleConfig = require('module-config-inc');
var Q = require('q');
var _ = require('underscore');

function ModuleConfig(options, inherits) {
    _.extend(this, options || {});
    _.defaults(this, inherits || {});
}
ModuleConfig.prototype.module = function (m) {
    return new ModuleConfig({ source: m }, this);
};
ModuleConfig.prototype.load = function (onload, options) {
    //apply defaults, use module if given
    options = options || {};
    options.source = options.source || this.source;
    var deferred = Q.defer();
    moduleConfig(options.source, function (err, config) {
        config = config || {};
        config.on = function() {};
        if (onload) {
            onload(config);
        } else {
            deferred.resolve(config);
        }
    });
    if (!onload) {
        return deferred.promise;
    }
};
module.exports = new ModuleConfig();
