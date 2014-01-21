Taglib.Function = function () {
    function Function() {
        this.name = null;
        this.functionClass = null;
        this.bindToContext = false;
    }
    Function.prototype = {};
    return Function;
}();