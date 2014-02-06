var startTagRegExp = /<((c|core):)?template[^>]*>\n/;
var paramsRegExp = /params="([^"]+)"/;
var endTagRegExp = /<\/((c|core):)?template>\s*/;
var elseRegExp = /c:else=""/g;
var emptyStartLineRegExp = /^\s*\n/;
var indentRegExp = /^\s*/;
var rightTrimRegExp = /\s*$/;

exports.transform = function(src) {
    var startTagMatches = startTagRegExp.exec(src);
    if (!startTagMatches) {
        return src;
    }

    src = src.replace(startTagRegExp, '');
    src = src.replace(endTagRegExp, '');
    src = src.replace(elseRegExp, 'c:else');

    while (true) {
        var foundEmptyLine = false;
        src = src.replace(emptyStartLineRegExp, function() {
            foundEmptyLine = true;
            return '';
        });

        if (!foundEmptyLine) {
            break;
        }
    }

    var indentMatches = indentRegExp.exec(src);
    if (indentMatches && indentMatches[0]) {
        var indent = indentMatches[0];
        var removeIndentRegExp = new RegExp('^[ ]{' + indent.length + '}', 'gm');
        src = src.replace(removeIndentRegExp, '');
    }

    src = src.replace(rightTrimRegExp, '');

    var paramMatches = paramsRegExp.exec(startTagMatches[0]);
    if (paramMatches) {
        var params = paramMatches[1].split(/\s*,\s*/);
        var varCode = params.filter(function(param) {
                if (param.trim() === '') {
                    return false;
                }
                return true;
            })
            .map(function(param) {
                param = param.trim();
                return  '<c:var name="' + param + '" value="data.' + param + '"/>';
            })
            .join('\n') + '\n\n';

        src = varCode + src;
    }

    return src;
};