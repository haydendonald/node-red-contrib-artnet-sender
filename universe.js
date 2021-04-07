module.exports = function(RED)
{
    //Main Function
    function Universe(config)
    {
        RED.nodes.createNode(this, config);
        var node = this;
        node.name = config.name;
        node.ipAddress = config.ipAddress;
        node.port = config.port;
        node.subnet = config.subnet;
        node.universeAuto = parseInt(config.universeAuto);
        node.universeManual = parseInt(config.universeManual);
        node.startChannel = 0;
        node.artnetType = config.artnetType;
        node.channels = config.channels;
        node.net = config.net;
        node.refresh = config.refresh;
        node.artnet = RED.nodes.getNode(config.artnet);
        node.fade = false;
        node.statusCallbacks = [];
        node.valueCallbacks = [];
        node.preparedChannels = {};
        node.universeId;
        node.universeCount = 1;
        node.fadeHandlers = [];
    
        //Add callbacks for status information
        node.addStatusCallback = function(func) {node.statusCallbacks.push(func);}
        node.addValueCallback = function(func) {node.valueCallbacks.push(func);}
        node.updateStatus = function(color, message) {
            for(var i in node.statusCallbacks) {
                node.statusCallbacks[i](color, message);
            }
        }
        node.updateValue = function() {
            for(var i in node.valueCallbacks) {
                var ret = [];
                for(var j = node.universeId; j < node.universeId; j++) {
                    ret[j] = {
                        "channels": []
                    };
                    for(var k = 0; j < 512; j++) {
                        ret[j].channels[k] = node.artnet.getChannel(j, k);
                    }
                }

                node.valueCallbacks[i](ret);
            }
        }

        //Add this universe(s)
        if(node.artnetType == "auto") {
            node.startChannel = node.universeAuto * 512;
            node.universeCount = Math.ceil(node.channels / 512);
            for(var i = 0; i < node.universeCount; i++) {
                var net = parseInt((node.universeAuto + i) / 256);
                var subnet = parseInt((node.universeAuto + i) / 16) - (net * 16);
                var universe = (node.universeAuto + i) - ((subnet * 16) + (net * 256));
                var id = node.artnet.addUniverse({
                    "ip": node.ipAddress,
                    "subnet": subnet,
                    "universe": universe,
                    "net": net,
                    "port": node.port,
                    "base_refresh_interval": node.refresh
                });

                //Store our start universe id
                if(i == 0) {
                    node.universeId = id;
                }
            }
        }
        else {
            node.startChannel = node.universeManual * 512;
            universeId = node.artnet.addUniverse({
                "ip": node.ipAddress,
                "subnet": node.subnet,
                "universe": node.universeManual,
                "net": node.net,
                "port": node.port,
                "base_refresh_interval": node.refresh
            });
        }

        //Add channels ready to send
        node.prepChannel = (channel, value, fadeTime) => {
            var universe = parseInt(channel / 512) + node.universeId;
            var uniChannel = channel - (parseInt(channel / 512) * 512);
            var changes = value - node.artnet.getChannel(universe, uniChannel);

            node.preparedChannels[channel] = {
                "universe": universe,
                "uniChannel": uniChannel,
                "changes": value - node.artnet.getChannel(universe, uniChannel),
                "fadeTime": fadeTime,
                "value": value,
                "changes": Math.abs(changes)
            };
        };

        //On close do some clean up
        node.on("close", () => {
            node.preparedChannels = {};
            for(var i in node.fadeHandlers) {
                clearTimeout(node.fadeHandlers[i]);
            }
        });

        //Send the channels stored in the prepared pool
        node.sendChannels = () => {
            var addFadeHandler = function(current) {
                node.fadeHandlers.push(setTimeout(function() {
                    if(node.artnet.getChannel(current.universe, current.uniChannel) > current.value) {
                        node.artnet.setChannel(current.universe, current.uniChannel, node.artnet.getChannel(current.universe, current.uniChannel) - 1);
                    }
                    else if(node.artnet.getChannel(current.universe, current.uniChannel) < current.value) {
                        node.artnet.setChannel(current.universe, current.uniChannel, node.artnet.getChannel(current.universe, current.uniChannel) + 1);
                    }
                }, j * (current.fadeTime / current.changes)));
            }

            for(var i in node.preparedChannels) {
                var current = node.preparedChannels[i];
                for(var j = 0; j < current.changes; j++) {
                    addFadeHandler(current);
                }
            }
        };
    }

    RED.nodes.registerType("artnet-universe", Universe);
}