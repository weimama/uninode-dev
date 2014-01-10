'use strict';

module.exports = {
    parallel: function(work, callback, thisObj) {
        
        var errors;
        var results;
        var len;
        var pending;
        var i;

        thisObj = thisObj || this;

        function onComplete(err) {
            pending--;
            if (err) {
                if (errors === undefined) {
                    errors = [];
                }
                errors.push(err);
            }

            if (pending === 0) {
                return callback.call(thisObj, errors, results);
            } else if (pending < 0) {
                throw new Error('callback invoked more than once');
            }
        }

        if (Array.isArray(work)) {
            len = pending = work.length;
            if (pending === 0) {
                return callback.call(thisObj);
            }

            for (i= 0; i < len; i++) {
                work[i].call(thisObj, onComplete);
            }
        } else {

            var keys = Object.keys(work);
            len = pending = keys.length;

            results = {};

            if (pending === 0) {
                return callback.call(thisObj, null, results);
            }

            var createCallback = function(key) {
                return function(err, data) {
                    results[key] = data;
                    onComplete(err);
                };
            };

            for (i= 0; i < len; i++) {
                var key = keys[i];
                work[key].call(thisObj, createCallback(key));
            }
        }
    },

    series: function(work, callback, thisObj) {
        
        var pending = work.length,
            index = 0;

        thisObj = thisObj || this;

        if (pending === 0) {
            return callback.call(thisObj);
        }

        function onComplete(err) {
            if (err) {
                // stop on first error
                return callback(err);
            }

            pending--;

            if (pending === 0) {
                return callback.call(thisObj);
            } else if (pending < 0) {
                throw new Error('callback invoked more than once');
            } else {
                index++;
                work[index].call(thisObj, onComplete);
            }
        }

        // kick off the tasks by invoking first job
        work[0].call(thisObj, onComplete);
    }
};