function Dog(breed) {
    // Invoke the constructor of the superclass:
    Dog.$super.call(this, 'dog');
    this.breed = breed;
}
Dog.prototype = {
    eat: function (food) {
        // Invoke the "eat" method in the superclass:
        Dog.$super.prototype.eat.apply(this, food);
        this.bark();
    },
    bark: function () {
        console.log('woof!');
    }
};
require('raptor-util').inherit(Dog, require('FIXME_some/namespace/Animal'));
module.exports = Dog;