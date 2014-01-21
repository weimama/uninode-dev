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
    var fullInputPath = 'transform-project/' + inputPath + '.js';
    var input = readFile(fullInputPath);
    var expectedOutput = readFile('transform-project/' + inputPath + '.expected.js');
    var transformed = require('../lib/js-transformer').transform(input, {
        resourceSearchPath: nodePath.join(__dirname, 'transform-project')
    });

    writeFile('transform-project/' + inputPath + '.actual.js', transformed);

    if (transformed !== expectedOutput) {
        throw new Error('Unexpected output for "' + fullInputPath + '":\nEXPECTED:\n---------\n' + expectedOutput + '\n---------\nACTUAL:\n---------\n' + transformed + '\n---------');
    }
    // expect(transformed).to.equal(expectedOutput);
}

describe('raptor-migrate/package-transformer' , function() {

    beforeEach(function(done) {
        done();
    });

    it('should transform define', function() {
        testTransform('simple-define');
    });

    it('should transform define.Class that returns a constructor function', function() {
        testTransform('define-class');
    });

    it('should transform define.Class with inheritance', function() {
        testTransform('some/namespace/Dog');
        testTransform('some/namespace/Animal');
    });

});

