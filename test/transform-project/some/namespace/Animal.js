define.Class(
    'some/namespace/Animal', //Name of the superclass
    function(require, exports, module) {
        var Animal = function(type) {
            this.type = type;
        };

        Animal.prototype = {
            
        };

        return Animal;
    });