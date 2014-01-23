var Message = function () {
        function Message(topic, props) {
            listeners.Message.call(this, topic, props);
            this.topic = topic;
        }
        Message.prototype = {
            getTopic: function () {
                return this.topic;
            }
        };
        require('raptor-util').inherit(Message, listeners.Message);
        return Message;
    }();