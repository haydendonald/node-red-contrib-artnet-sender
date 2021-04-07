module.exports = function(RED)
{
    //Main Function
    function Output(config)
    {
        RED.nodes.createNode(this, config);

        var universe = RED.nodes.getNode(config.universe);
        var name = config.name;
        var node = this;

        //Add a callback to show status on this node
        universe.addStatusCallback(function(state, message) {
            switch(state) {
                case "success": {
                    node.status({fill:"green",shape:"dot",text:message});
                    node.sendMessage({
                        "topic": "information",
                        "payload": {
                            "type": "success",
                            "message": message
                        }
                    });
                    break;
                }
                case "error": {
                    node.status({fill:"red",shape:"dot",text:message});
                    node.sendMessage({
                        "topic": "information",
                        "payload": {
                            "type": "error",
                            "message": message
                        }
                    });
                    break;
                }
            }
        });

        universe.addValueCallback((output) => {
            node.sendMessage({
                "payload": output
            });
        });

        //The msg output handler. We also add some information about the universe
        node.sendMessage = function(msg) {
            node.send(msg);
        }

        //When we get an input on the node validate it and translate
        this.on("input", function(msg) {
            switch(msg.topic) {
                case "reset": {
                    universe.reset();
                    break;
                }
                default: {
                    if(msg.payload === undefined) {
                        node.error("There is no payload specified");
                        return;
                    }
                    else {
                        var channels = msg.payload.channels || [];
                        var fadeTime = msg.payload.fadeTime || 0;
                        //Validate the channels first before sending
                        for(var i in channels) {
                            if(parseInt(i) > universe.universeCount * 512) {
                                node.error("There are too many channels specified. This universe only has " + universe.universeCount * 512 + " channels (" + universe.universeCount + " universes)");
                                return;
                            }
                        }
                        for(var i in channels) {
                            universe.prepChannel(parseInt(i), channels[i].value, channels[i].fadeTime || fadeTime);
                        }
                        universe.sendChannels();
                    }
                }
            }
        });

    }

    RED.nodes.registerType("artnet-output", Output);
}