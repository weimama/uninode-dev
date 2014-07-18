
var soa = require('soa-ebay').transport;
var rest = require('rest-ebay').transport;
var servicecore = require('servicecore');
var configer = require('module-config-inc');
var _ = require('underscore');

function requestSvc(config, transport) {
  return {

    request: function(servicePath, options, callback) {
        options = options || {};
        options.headers = options.headers || {};
        options.path = servicePath;

        transport(options, callback);
    }

  };
}

servicecore.register('requestSvc', requestSvc);

function getClient(serviceName, options, callback) {
    options = options || {};
    configer(module, function(err, config) {
        var svcConfig = config.get('services:'+serviceName);
        // console.log(' config:', serviceName, ' svcConfig:', svcConfig);
        _.keys(svcConfig).forEach(function(key) {
            if(options[key]) {
                svcConfig[key] = options[key];
            }
        });

        var client = servicecore.create('requestSvc', svcConfig);
        return callback(null, client);
    });
}

function sendRequest(serviceConfigName, servicePath, options, callback) {
    // console.log('servicePath:', servicePath);
    getClient(serviceConfigName, options, function(err, client) {
        client.request(servicePath, options, callback);
    });
}


function restClient() {
    this.options = {
    };
    this.options.settings = {};
}

restClient.prototype.timeout = function timeout(timeOut) {
    var self = this;
    self.options.settings.timeout = timeOut;
    return self;
};

restClient.prototype.retry = function retry(reTry) {
    var self = this;
    self.options.settings.retry = reTry;
    return self;
};

restClient.prototype.markdownThreshold = function markdownThreshold(markdownThreshold_) {
    var self = this;
    self.options.settings.markdownthreshold = markdownThreshold_;
    return self;
};

restClient.prototype.getClient = function getClient(opts, ctx) {
    var self = this;

    return self;
};

restClient.prototype.handler = function handler() {
    var self = this;
    return self;
};

restClient.prototype.operationName = function operationName(operationname) {
    var self = this;
    self.options.operationName = operationname;
    return self;
};

restClient.prototype.serviceName = function serviceName(servicename) {
    var self = this;
    self.serviceName = self.seviceName || serviceName;
    self.options.serviceName = servicename;
    return self;
};

restClient.prototype.options = function options(opt) {
    var self = this;
    opt = opt || {};
    _.keys(opt).forEach(function(key) {
        if(key === 'timeout' || key=== 'retry' || key === 'markdownThreshold' || key=== 'markupTimeout') {
            self.options.settings[key] = opt[key];
        } else {
            self.options[key] = opt[key];
        }
    });

    return self;
};

restClient.prototype.request = function request(url, callback) {
    var self = this;

    if(arguments.length === 0) {
        url = this.url || '';
    }
    url = url || '';

    if(callback) {
        sendRequest(self.serviceName, url, self.options, function(err, res) {
            if(res && res.body && Buffer.isBuffer(res.body)) {
                res.body = res.body.toString();
            }
            // console.log('url:', url);
            // console.log('-----$$$$$res:', res.body);
            // console.log(res);
            return callback(err, res);
        });
    } else {
        var deferred = require('q').defer();
        sendRequest(self.serviceName, url, self.options, function (err, res) {
            if(res && res.body && Buffer.isBuffer(res.body)) {
                res.body = res.body.toString();
            }
            // console.log('svc: ', self.serviceName, ' res:', res.body);
            if(err) {
                deferred.reject(err);
                return;
            }
            deferred.resolve(res);
        });
        return deferred.promise;
    }
};

function service(endpoint, serviceName) {
    var client = new restClient();
    client.endpoint = endpoint;
    client.serviceName = serviceName;
    client.options.serviceName = serviceName;
    if(endpoint) {
        var result = require('url').parse(endpoint, true);
        client.options.basepath = result.path;
    }
    // if(endpoint) {
    //     var result = require('url').parse(endpoint, true);
    //     client.options.protocol = result.protocol;
    //     client.options.hostname = result.hostname;
    //     client.options.basepath = result.path;
    // }

    return client;
}

function getRestClient(url, options) {
    var client = new restClient();
    client.url = url;
    client.options(options);
    return client;
}

module.exports = {
    service: service,
    getClient: getRestClient,
    request: sendRequest
};
