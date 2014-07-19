'use strict';

require('raptor-polyfill');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');


function hasCommonsNode(node, name) {
    if (!node || !node.callee || !node.callee.property) {
        return false;
    }
    return node.callee.property.name === name;
}

function hasCommons(node) {
    var arr = ['getSiteId', 'getMarketplaceId', 'getTerritoryId'];
    var r = false;
    arr.forEach(function(a) {
        r = r || hasCommonsNode(node, a);
    });
    return r;
}

function checkRequest(n) {
    if (!n) {
        return false;
    }
    if (n.type !== 'MemberExpression') {
        return false;
    }
    if (n.object && n.object.property && n.object.property.name ===
        'attributes' && n.property && n.property.name === 'request') {
        return true;
    }
    return false;
}

function transformRequest(n) {
    if (!checkRequest(n)) {
        return;
    }
    var m = {
        "type": "CallExpression",
        "callee": {
            "type": "MemberExpression",
            "computed": false,
            "object": {
                "type": "CallExpression",
                "callee": {
                    "type": "Identifier",
                    "name": "require"
                },
                "arguments": [{
                    "type": "Literal",
                    "value": "commons-ebay",
                    "raw": "'commons-ebay'"
                }]
            },
            "property": {
                "type": "Identifier",
                "name": "getFromCtx"
            }
        },
        "arguments": [{
            "type": "Literal",
            "value": "req",
            "raw": "'req'"
        }]
    };

    n.type = m.type;
    n.callee = m.callee;
    n.arguments = m.arguments;
    delete n.computed;
    delete n.object;
    delete n.property;

}

function checkLocale(n) {
    if (!n) {
        return false;
    }
    if (n.type !== 'CallExpression') {
        return false;
    }
    if (n.callee && n.callee.object && n.callee.object.property && n.callee.object
        .property.name === 'ebay') {
        if (n.callee.property && n.callee.property.name === 'getLocale') {
            return true;
        }
    }
    return false;
}

function transformLocale(n) {
    if (!checkLocale(n)) {
        return;
    }

    var m = {
        "type": "MemberExpression",
        "computed": false,
        "object": {
            "type": "CallExpression",
            "callee": {
                "type": "MemberExpression",
                "computed": false,
                "object": {
                    "type": "CallExpression",
                    "callee": {
                        "type": "Identifier",
                        "name": "require"
                    },
                    "arguments": [{
                        "type": "Literal",
                        "value": "locale-ebay",
                        "raw": "'locale-ebay'"
                    }]
                },
                "property": {
                    "type": "Identifier",
                    "name": "getLocality"
                }
            },
            "arguments": []
        },
        "property": {
            "type": "Identifier",
            "name": "locale"
        }
    };

    n.type = m.type;
    n.computed = m.computed;
    n.object = m.object;
    n.property = m.property;
    delete n.callee;
    delete n.arguments;

}

function checkLang(n) {
    if (!n) {
        return false;
    }
    if (n.type === 'MemberExpression' && n.object && n.object.property && n.object
        .property.name === 'locale') {
        if (n.property.name === 'language' && n.property.type === 'Identifier') {
            return true;
        }
    }
    return false;
}

function transformLang(n) {
    if (!checkLang(n)) {
        return;
    }
    n.object = {
        "type": "CallExpression",
        "callee": {
            "type": "MemberExpression",
            "computed": false,
            "object": {
                "type": "CallExpression",
                "callee": {
                    "type": "Identifier",
                    "name": "require"
                },
                "arguments": [{
                    "type": "Literal",
                    "value": "locale-ebay",
                    "raw": "'locale-ebay'"
                }]
            },
            "property": {
                "type": "Identifier",
                "name": "getLocality"
            }
        },
        "arguments": []
    };

}

function checkOutboundContext(n) {
    if (!n) {
        return false;
    }
    if (n.type !== 'MemberExpression') {
        return false;
    }
    if (n.object && n.object.property) {
        var p = n.object.property;
        if (p.type === 'Identifier' && p.name === 'outboundContext') {
            if (n.property && n.property.value === 'X-EBAY-TERRITORY-ID') {
                return true;
            }
        }
    }
    return false;
}

function transformOutboundContext(n) {
    if (!checkOutboundContext(n)) {
        return;
    }
    var m = {
        "type": "CallExpression",
        "callee": {
            "type": "MemberExpression",
            "computed": false,
            "object": {
                "type": "CallExpression",
                "callee": {
                    "type": "Identifier",
                    "name": "require"
                },
                "arguments": [{
                    "type": "Literal",
                    "value": "commons-ebay",
                    "raw": "'commons-ebay'"
                }]
            },
            "property": {
                "type": "Identifier",
                "name": "getTerritoryId"
            }
        },
        "arguments": []
    };
    n.type = m.type;
    n.callee = m.callee;
    n.arguments = m.arguments;
    delete n.computed;
    delete n.object;
    delete n.property;

}

function checkEbayLocale(n) {
    if (!n) {
        return false;
    }
    if (n.type !== 'CallExpression') {
        return false;
    }
    if (!n.callee) {
        return false;
    }
    var c = n.callee;
    if (c.type === 'MemberExpression' && c.object.object && c.object.object.property &&
        c.object.object.property.name === 'ebay') {
        if (c.object.property.name === 'locale' && c.property.name ===
            'toString') {
            return true;
        }
    }
    return false;
}

function transformEbayLocale(n) {
    if (!checkEbayLocale(n)) {
        return;
    }

    n.callee = {
        "type": "MemberExpression",
        "computed": false,
        "object": {
            "type": "MemberExpression",
            "computed": false,
            "object": {
                "type": "CallExpression",
                "callee": {
                    "type": "MemberExpression",
                    "computed": false,
                    "object": {
                        "type": "CallExpression",
                        "callee": {
                            "type": "Identifier",
                            "name": "require"
                        },
                        "arguments": [{
                            "type": "Literal",
                            "value": "locale-ebay",
                            "raw": "'locale-ebay'"
                        }]
                    },
                    "property": {
                        "type": "Identifier",
                        "name": "getLocality"
                    }
                },
                "arguments": []
            },
            "property": {
                "type": "Identifier",
                "name": "locale"
            }
        },
        "property": {
            "type": "Identifier",
            "name": "toString"
        }
    };


}

function transformAST(ast, options, moduleOptions) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {},

        leave: function(node, parent) {

            if (node.type === 'CallExpression' &&
                node.callee.type === 'MemberExpression' &&
                (node.callee.object.type === 'Identifier' || node.callee.object
                    .type === 'MemberExpression') &&
                node.callee.property.type === 'Identifier' &&
                hasCommons(node) &&
                node.arguments.length === 0
            ) {
                // console.log('---:', moduleOptions.file, node);


                delete node.callee.object;
                node.callee.object = {
                    "type": "CallExpression",
                    "callee": {
                        "type": "Identifier",
                        "name": "require"
                    },
                    "arguments": [{
                        "type": "Literal",
                        "value": "commons-ebay",
                        "raw": "'commons-ebay'"
                    }]
                };

            }

            transformRequest(node);

            transformLocale(node);

            transformLang(node);

            transformOutboundContext(node);

            transformEbayLocale(node);

        }
    });

    return ast;
}

exports.transformAST = transformAST;
