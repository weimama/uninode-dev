var chai = require('chai');
chai.Assertion.includeStack = true;
require('chai').should();
var fs = require('fs');

// var expect = require('chai').expect;
var nodePath = require('path');

function readFile(path) {
    return fs.readFileSync(nodePath.join(__dirname, path), {encoding: 'utf8'});
}

function writeFile(path, str) {
    return fs.writeFileSync(nodePath.join(__dirname, path), str, {encoding: 'utf8'});
}

function testTransform(inputPath) {
    var fullInputPath = 'transform-project/xml-templates/' + inputPath + '.rxml';
    var fullActualPath = 'transform-project/xml-templates/' + inputPath + '.actual.rhtml';
    var fullExpectedPath = 'transform-project/xml-templates/' + inputPath + '.expected.rhtml';
    var input = readFile(fullInputPath);
    var expectedOutput = readFile(fullExpectedPath);
    var transformed = require('../lib/xml-template-transformer').transform(input);

    writeFile(fullActualPath, transformed);

    if (transformed !== expectedOutput) {
        throw new Error('Unexpected output for "' + fullInputPath + '":\nEXPECTED (' + fullExpectedPath + '):\n---------\n' + expectedOutput +
            '\n---------\nACTUAL (' + fullActualPath + '):\n---------\n' + transformed + '\n---------');
    }
    // expect(transformed).to.equal(expectedOutput);
}

describe('raptor-dev/xml-template-transformer' , function() {

    beforeEach(function(done) {
        done();
    });

    it('should transform define', function() {
        testTransform('simple');
    });

});

