var htmlparser = require("htmlparser2");
require('raptor-polyfill');
var transformDependency = require('./package-transformer').transformDependency;

var parserOptions  = {
    recognizeSelfClosing: true,
    recognizeCDATA: true,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
    xmlMode: false
};

module.exports = function extractOptimizerDependencies(src, file, rootDir) {
    var dependencies = [];
    
    var inOptimizerPage = false;
    var inOptimizerDependencies = false;

    var parser = this.parser = new htmlparser.Parser({
        onopentag: function(name, attribs){

            if (name === 'optimizer-page') {
                inOptimizerPage = true;
            } else if (name === 'dependencies') {
                inOptimizerDependencies = true;
            } else {
                if (inOptimizerPage && inOptimizerDependencies) {
                    if (!name.startsWith('c-')) {
                        
                        var dependency = {
                            type: name
                        };

                        for (var attrName in attribs) {
                            if (attribs.hasOwnProperty(attrName) && !attrName.startsWith('c-')) {
                                var attrValue = attribs[attrName];
                                if (attrValue === 'true') {
                                    attrValue = true;
                                }
                                else if (attrValue === 'false') {
                                    attrValue = false;
                                }

                                dependency[attrName] = attrValue;
                            }
                        }

                        dependency = transformDependency(dependency, file, rootDir);
                        if (dependency) {
                            dependencies.push(dependency);
                        }
                    }    
                }
            }
        },
        onprocessinginstruction: function(name, data) {
        },
        ontext: function(text){
            
        },
        onclosetag: function(name){
            if (name === 'optimizer-page') {
                inOptimizerPage = false;
            } else if (name === 'dependencies') {
                inOptimizerDependencies = false;
            }
        }
    }, parserOptions);
    parser.write(src);
    parser.end();

    if (dependencies && dependencies.length) {

        var transformed = src.replace(/(<optimizer-page[^>]*)>[^]*<\/optimizer-page>/, function(match, startTag) {
            return startTag + ' package-path="./optimizer.json" />';
        });

        return {
            dependencies: dependencies,
            transformed: transformed
        };
    }

    

    return null;
};