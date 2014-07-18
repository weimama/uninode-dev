'use strict';
var promise = require('q');
function toPromise(thisArg, funcName, funcArgs) {
    var deferred = promise.defer();
    funcArgs = funcArgs || [];
    function callback(err, result) {
        if (err) {
            return deferred.reject(err);
        }
        deferred.resolve(result);
    }
    funcArgs.push(callback);
    funcName.apply(thisArg, funcArgs);
    return deferred.promise;
}
// function f(a1, a2, callback) {
//     console.log('a1:', a1, 'a2:', a2);
//
//     return callback(null, a1+'--'+a2);
// }
// var a1= 'r1';
// var a2 = 'r2';
// f.apply(null, [a1,a2]);
// f.call(null, a1, a2);
// var fp = toPromise(null, f, [a1, a2]);
// fp.then(function(r){
//     console.log('r:', r);
// }).fail(function(e){
//     console.log('e:', e);
// });
module.exports = { toPromise: toPromise };
