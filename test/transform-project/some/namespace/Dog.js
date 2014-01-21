define.Class(
    'some/namespace/Dog', 
    'some/namespace/Animal', //Name of the superclass
    function(require, exports, module) {
        var Dog = function(breed) {
            // Invoke the constructor of the superclass:
            Dog.superclass.constructor.call(this, "dog"); 
            this.breed = breed;
        }

        Dog.prototype = {
            eat: function(food) {
                // Invoke the "eat" method in the superclass:
                Dog.superclass.eat.apply(this, food); 
                this.bark();
            },

            bark: function() {
                console.log("woof!");
            }
        };

        return Dog;
    });