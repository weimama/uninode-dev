var includeRegExp = /<c[:-]include((?:(?:\s+(?:[A-Za-z0-9_-]+:)?[A-Za-z0-9_-]+)(?:="(?:[^"]*)"))*)(?:>((?:.|\s)*?)(?=<\/c[:-]include\s*>)<\/c[:-]include\s*>|\/s*>)/g;
var attributesRegExp = /(\s+(?:[A-Za-z0-9_-]+:)?[A-Za-z0-9_-]+)(?:="([^"]*)")/g;


function replace(src, callback) {
    

    includeRegExp.lastIndex = 0;


    // console.log(module.id, 'src: ', src);
    src = src.replace(includeRegExp, function(match, attributesStr, body) {
        attributesRegExp.lastIndex = 0;

        // console.log(module.id, 'args: ', arguments);

        var attributeMatches;
        var attributes = {};

        while ((attributeMatches = attributesRegExp.exec(attributesStr))) {
            var attrName = attributeMatches[1].trim();
            var attrValue = attributeMatches[2];
            attributes[attrName] = attrValue;
        }



        var replacement = callback({
            attributes: attributes,
            body: body
        });

        if (replacement == null) {
            return match;
        }

        if (typeof replacement === 'string') {
            return replacement;
        }

        var result = '<' + replacement.tagName;
        result += Object.keys(replacement.attributes).map(function(attrName) {
                var attrValue = replacement.attributes[attrName];
                return ' ' + attrName + '="' + attrValue + '"';
            })
            .join('');

        if (replacement.body) {
            result += '>' + replacement.body + '</' + replacement.tagName + '>';
        } else {
            result += '/>';
        }
        return result;
        
    });

    return src;
}

exports.replace = replace;