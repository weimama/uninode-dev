var chai = require('chai');
chai.Assertion.includeStack = true;
require('chai').should();
var expect = require('chai').expect;
var nodePath = require('path');

var optimizerFixRelativePaths = require('../lib/optimizerFixRelativePaths');

describe('raptor-dev/optimizerFixRelativePaths' , function() {

    beforeEach(function(done) {
        

        done();
    });

    it('should fix relative paths for a manifest inside a moved directory', function() {
        var manifest = optimizerFixRelativePaths(
            {
                "dependencies": [
                    "../world/test.js",
                    "require: ../world/test",
                    "require: ./widget"
                ]
            },
            nodePath.join(__dirname, 'to/hello/optimizer.json'),
            nodePath.join(__dirname, 'from'),
            nodePath.join(__dirname, 'to'));

        // console.log('PKG: ', pkg);

        expect(manifest).to.deep.equal({
            "dependencies": [
                "../world/test.js",
                "require: ../world/test",
                "require: ./widget"
            ]
        });        
    });

    it('should fix relative paths for a manifest outside a moved directory', function() {
        var manifest = optimizerFixRelativePaths(
            {
                "dependencies": [
                    "../../from/world/test.js",
                    "require: ../../from/world/test"
                ]
            },
            nodePath.join(__dirname, 'foo/hello/optimizer.json'),
            nodePath.join(__dirname, 'from'),
            nodePath.join(__dirname, 'to'));

        // console.log('PKG: ', pkg);

        expect(manifest).to.deep.equal({
            "dependencies": [
                "../../to/world/test.js",
                "require: ../../to/world/test"
            ]
        });
    });
});

