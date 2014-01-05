var chai = require('chai');
chai.Assertion.includeStack = true;
require('chai').should();
var expect = require('chai').expect;

var packageTransformer = require('../lib/package-transformer');

describe('raptor-migrate/package-transformer' , function() {

    beforeEach(function(done) {
        

        done();
    });

    it('should transform ultra-legacy package.json', function() {
        var pkg = packageTransformer.transform({
            "type": "module",
            "name":"raptor.client",
            "version":"1.0",
            "description":"Raptor Client",
            "homepage":"http://wiki2.arch.ebay.com/display/RAPTOR/Home",
            "authors":[
                {"name":"Rich Heisterberg","email":"rheisterberg@ebay.com"}
            ],

            "includes": [
                { "path": "test.js" }
            ],

            "extensions":{
                "raptor.client.features": {
                    "includes": [
                       {"type":"module", "name":"raptor.client.features"}
                    ]
                }
            }

        });

        expect(pkg).to.deep.equal({
            "dependencies": [
                "test.js",
                {"package": "raptor/client/features", "if-extension": "raptor.client.features"}
            ]
        });
    });

    it('should handle extenions as an array', function() {
        var pkg = packageTransformer.transform({
            "raptor": {
                "dependencies": [
                    "test.js"
                ],
                "extensions": [
                    {
                        "name": "raptor.client.features",
                        "includes": [
                            {"type":"module", "name":"raptor.client.features"}
                        ]
                    }
                ]
            }

        });

        expect(pkg).to.deep.equal({
            "dependencies": [
                "test.js",
                {"package": "raptor/client/features", "if-extension": "raptor.client.features"}
            ]
        });
    });

});

