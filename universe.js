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
        node.universe = config.universe;
        node.net = config.net;
        node.refresh = config.refresh;
        node.artnet = RED.nodes.getNode(config.artnet);
        node.fade = false;
        node.statusCallbacks = [];
        node.currentOutput = [];
        node.preparedChannels = {};
        node.channelFadeHandler;
        var artnetId;
    
        //Add callbacks for status information
        node.addStatusCallback = function(func) {node.statusCallbacks.push(func);}
        node.updateStatus = function(color, message) {
            for(var i in statusCallbacks) {
                node.statusCallbacks[i](color, message);
            }
        }

        //Add this universe
        artnetId = node.artnet.addUniverse({
            "ip": node.ipAddress,
            "subnet": node.subnet,
            "universe": node.universe,
            "net": node.net,
            "port": node.port,
            "base_refresh_interval": node.refresh
        });

        //Add listener to self to store current artnet data
        node.artnet.addDataListener(artnetId, (data) => {
            node.currentOutput = data;
        });

        //Add channels ready to send
        node.prepChannel = (channel, value, fadeTime) => {
            node.preparedChannels[channel] = {
                "value": value,
                "current": node.currentOutput[channel],
                "updatesPerMS": (value - node.currentOutput[channel]) * 10 / fadeTime
            }
        };

        //The updater to send channels (this also processes fade times)
        node.channelFadeHandler = setInterval(() => {
            var changed = false;
            if(node.fade) {
                for(var i in node.preparedChannels) {
                    if(node.preparedChannels[i].value != node.currentOutput[i]) {
                        changed = true;
                        node.preparedChannels[i].current += node.preparedChannels[i].updatesPerMS;
                        if(node.preparedChannels[i].current > node.preparedChannels[i].value && node.preparedChannels[i].updatesPerMS > 0){node.preparedChannels[i].current = node.preparedChannels[i].value;}
                        if(node.preparedChannels[i].current < node.preparedChannels[i].value && node.preparedChannels[i].updatesPerMS < 0){node.preparedChannels[i].current = node.preparedChannels[i].value;}
                        node.artnet.setChannel(artnetId, parseInt(i), node.preparedChannels[i].current);
                    }
                }

                if(!changed){node.fade = false; node.preparedChannels = [];}
                else {
                    node.artnet.transmit(artnetId);
                }
            }
        }, 1);

        //Reset the universe
        node.reset = () => {
            clearInterval(node.channelFadeHandler);
            node.artnet.reset();
        }

        //On close do some clean up
        node.on("close", () => {
            clearInterval(node.channelFadeHandler);
        });

        //Send the channels stored in the prepared pool
        node.sendChannels = () => {
            node.fade = true;
        };
    }

    RED.nodes.registerType("artnet-universe", Universe);
}