var Message = define.Class({ superclass: listeners.Message }, function () {
        function Message(topic, props) {
            listeners.Message.call(this, topic, props);
            this.topic = topic;
        }
        Message.prototype = {
            getTopic: function () {
                return this.topic;
            }
        };
        return Message;
    });