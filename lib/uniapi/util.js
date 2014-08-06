'use strict';

var _ = require('underscore');
var assert = require('assert');
var shell = require('shelljs');

module.exports.exec = function (cmd) {
    console.log(cmd);
    // return;
    var r = shell.exec(cmd);
    if(r && r.code !== 0) {
        console.log(r);
    }
    return r;
};


module.exports.remove = function (node, body) {
    var nodeIndex = body.indexOf(node);
    assert.ok(nodeIndex !== -1);
    body.splice(nodeIndex, 1);
};

module.exports.fixDependencyVersion = function (obj) {
    if(!obj) {
        return null;
    }
    _.each(_.keys(obj), function(k) {
        obj[k] = obj[k].replace('^0','~0');
        if(obj[k].indexOf('~0') === 0) {
            obj[k] = '~0';
        }
    });

    return obj;
};

module.exports.sortObject = function (obj) {
    if(!obj) {
        return null;
    }
    var keys = _.sortBy(_.keys(obj), function(a) { return a; });
    var newmap = {};
    _.each(keys, function(k) {
        newmap[k] = obj[k];
    });
    return newmap;
};

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
};

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
