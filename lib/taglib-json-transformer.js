var fs = require('fs');

exports.transform = function(file) {
    var src = fs.readFileSync(file, 'utf8');
    var taglib = JSON.parse(src);

    var namespaces = taglib.namespace || taglib.namespaces;
    if (!namespaces) {
        return taglib;
    }

    var prefix;

    function prefixAttributes(attributes) {
        Object.keys(attributes).forEach(function(attrName) {
            var attr = attributes[attrName];
            delete attributes[attrName];
            attrName = prefix + '-' + attrName;
            attributes[attrName] = attr;    
        });
    }

    if (!Array.isArray(namespaces)) {
        prefix = namespaces;
    } else {
        namespaces.sort(function(a, b) {
            return a.length - b.length;
        });
        prefix = namespaces[0];

        delete taglib.namespaces;
        delete taglib.namespace;
    }

    if (taglib.attributes) {
        prefixAttributes(taglib.attributes);
    }

    if (taglib.tags) {
        Object.keys(taglib.tags).forEach(function(tagName) {
            var tag = taglib.tags[tagName];

            if (tagName === '*') {
                if (tag.attributes) {
                    prefixAttributes(tag.attributes);
                }
            } else {
                delete taglib.tags[tagName];
                tagName = prefix + '-' + tagName;
                taglib.tags[tagName] = tag;    
            }
        });
    }

    delete taglib.namespace;
    delete taglib.namespaces;

    return taglib;
};