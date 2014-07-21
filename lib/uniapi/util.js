'use strict';

module.exports.get = function(obj, key) {
    if(!key) {
        return obj;
    }
    var keys = key.split('.');
    var o = obj;
    for(var i=0;i<keys.length; i++) {
        var curKey = keys[i];
        o = o[curKey];
        if(!o) {
            return null;
        }
    }
    return o;
};

module.exports.isEmpty = function(obj, key) {
    if(!obj) {
        return true;
    }
    if(!key) {
        return obj;
    }
    var keys = key.split('.');
    var o = obj;
    for(var i = 0; i<keys.length; i++) {
        var curKey = keys[i];
        if(!o[curKey]) {
            return true;
        }
        o = o[curKey];
    }
    return false;
};
