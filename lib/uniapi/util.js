'use strict';

module.exports.exec = function(cmd) {
    // if(cmd && cmd.indexOf('uninode-dev') === -1) {
    //     return;
    // }

    console.log(cmd);
    // return;
    var r = require('shelljs').exec(cmd);
    if(r && r.code !== 0) {
        console.log(r);
    }
    return r;
}
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
