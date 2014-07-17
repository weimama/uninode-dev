var chai = require('chai');
chai.Assertion.includeStack = true;
require('chai').should();
var expect = require('chai').expect;
var findTemplateIncludes = require('../lib/find-template-includes');
var nodePath = require('path');
var fs = require('fs');
var extend = require('raptor-util/extend');

describe('raptor-dev/isCommonJSModule' , function() {

    beforeEach(function(done) {
        done();
    });

    it('should replace includes correctly', function() {
        var inFile = nodePath.join(__dirname, 'template-includes/test1.rhtml');

        var src = fs.readFileSync(inFile, 'utf8');

        var matches = [];

        var outSrc = findTemplateIncludes.replace(src, function(match) {
            matches.push(match);

            var template = match.attributes.template.replace(/\//g, '-');
            var attributes = extend({}, match.attributes);
            delete attributes.template;

            return {
                tagName: template,
                attributes: attributes,
                body: match.body
            };
        });

        matches = JSON.parse(JSON.stringify(matches)); // wtf, why is this needed?

        // console.log(JSON.stringify(matches, null, 4));

        // expect([{
        //             "attributes": {
        //                 "template": "ui/components/foo",
        //                 "hello": "world"
        //             },
        //             "body": ""
        //         }]).to.deep.equal([{
        //             "attributes": {
        //                 "template": "ui/components/foo",
        //                 "hello": "world"
        //             },
        //             "body": "s"
        //         }]);

        expect(matches).to.deep.equal([
                {
                    "attributes": {
                        "template": "ui/components/foo",
                        "hello": "world"
                    },
                    "body": ""
                },
                {
                    "attributes": {
                        "template": "ui/components/bar",
                        "hello": "world"
                    }
                },
                {
                    "attributes": {
                        "template": "ui/components/baz",
                        "hello": "world"
                    },
                    "body": "\n    Hello World!\n"
                }
            ]);

        expect(outSrc).to.equal("<ui-components-foo hello=\"world\"/>\n<ui-components-bar hello=\"world\"/>\n<ui-components-baz hello=\"world\">\n    Hello World!\n</ui-components-baz>");
    });
});

