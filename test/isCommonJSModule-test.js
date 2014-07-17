var chai = require('chai');
chai.Assertion.includeStack = true;
require('chai').should();
var expect = require('chai').expect;

var isCommonJSModule = require('../lib/isCommonJSModule');

describe('raptor-dev/isCommonJSModule' , function() {

    beforeEach(function(done) {
        done();
    });

    it('should handle negative cases', function() {
        expect(isCommonJSModule('hello="world"')).to.equal(false);
    });

    it('should detect define', function() {
        expect(isCommonJSModule('define("a", function() { return {}; });')).to.equal(true);
    });

    it('should detect exports.test = ...', function() {
        expect(isCommonJSModule('exports.test = 1;')).to.equal(true);
    });

    it('should detect module.exports = ...', function() {
        expect(isCommonJSModule('module.exports = 1;')).to.equal(true);
    });

    it('should detect module.exports.test = ...', function() {
        expect(isCommonJSModule('module.exports.test = 1;')).to.equal(true);
    });

    it('should traverse into nested blocks', function() {
        expect(isCommonJSModule('if(true) {module.exports = test;}')).to.equal(true);
    });
});

