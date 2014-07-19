var deviceDetction = require('device-detection-inc');

module.exports.middleware = {};

module.exports.middleware.getDeviceInfo = function (options) {
    options = options || {};
    return deviceDetection.middleware(options);
};

module.exports.getDeviceInfo = function (req) {
var deferred = require('q').defer();
var agent =  req && req.headers && req.headers['user-agent'];
if(!agent) {
    req = require('commons-ebay').getFromCtx('req');
    agent =  req && req.headers && req.headers['user-agent'];
}
agent = agent || '';
deviceDetction.getDeviceInfo(agent, function (error, deviceInfo) {
    if (error) {
        deferred.reject(error);
        return;
    }
    deferred.resolve(deviceInfo);
});
return deferred.promise;
};
