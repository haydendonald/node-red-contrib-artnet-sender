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
        node.universeManual = config.universeManual;
        node.artnetType = config.artnetType;
        node.channels = config.channels;
        node.net = config.net;
        node.refresh = config.refresh;
        node.artnet = RED.nodes.getNode(config.artnet);
        node.fade = false;
        node.statusCallbacks = [];
        node.valueCallbacks = [];
        node.currentOutput = [];
        node.preparedChannels = {};
        node.universeFadeHandlers = [];
        node.universeId;
        node.universeCount = 1;
    
        //Add callbacks for status information
        node.addStatusCallback = function(func) {node.statusCallbacks.push(func);}
        node.addValueCallback = function(func) {node.valueCallbacks.push(func);}
        node.updateStatus = function(color, message) {
            for(var i in node.statusCallbacks) {
                node.statusCallbacks[i](color, message);
            }
        }
        node.updateValue = function(values) {
            for(var i in node.valueCallbacks) {
                node.valueCallbacks[i](node.currentOutput);
            }
        }

        node.universeHandler = function(universe) {
            var changed = false;
            if(node.fade) {
                for(var i in node.preparedChannels) {
                    if(node.preparedChannels[i].universe == universe) {
                        console.log(universe);
                        if(node.preparedChannels[i].value == node.currentOutput[i]) {
                            node.preparedChannels[i].changes = 0;
                        }
                        else {
                            var updatesPerMS = node.preparedChannels[i].changes * ((node.preparedChannels.length / 10) / node.preparedChannels[i].fadeTime);
                            node.preparedChannels[i].current += updatesPerMS;
                            if(node.preparedChannels[i].current > node.preparedChannels[i].value && updatesPerMS > 0){node.preparedChannels[i].current = node.preparedChannels[i].value;}
                            if(node.preparedChannels[i].current < node.preparedChannels[i].value && updatesPerMS < 0){node.preparedChannels[i].current = node.preparedChannels[i].value;}
                            node.artnet.setChannel(node.universeId + universe, parseInt(i) - (512 * universe), node.preparedChannels[i].current);
                        }
                    }
                }
            }
        }

        //Add this universe(s)
        if(node.artnetType == "auto") {
            node.universeCount = Math.ceil(node.channels / 512);
            for(var i = 0; i < node.universeCount; i++) {
                var subnet = parseInt((node.universeAuto + i) / 16);
                var net = parseInt((node.universeAuto + i) / 256);
                var universe = (node.universeAuto + i) - ((subnet * 16) + (net * 256));
                var id = node.artnet.addUniverse({
                    "ip": node.ipAddress,
                    "subnet": subnet,
                    "universe": universe,
                    "net": net,
                    "port": node.port,
                    "base_refresh_interval": node.refresh
                });
                node.universeFadeHandlers[id] = setInterval(node.universeHandler, 1, id);

                //Store our start universe id
                if(i == 0) {
                    node.universeId = id;
                }
            }
        }
        else {
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
            if(node.currentOutput[channel] === undefined){node.currentOutput[channel] = 0;}
            node.preparedChannels[channel] = {
                "universe": parseInt(parseInt(i) / 512),
                "value": value,
                "current": node.currentOutput[channel],
                "changes": value - node.currentOutput[channel],
                "fadeTime": fadeTime
            }
        };

        //The updater to send channels (this also processes fade times)
        // node.universeFadeHandler = setInterval(() => {
        //     var changed = false;
        //     if(node.fade) {
        //         for(var i in node.preparedChannels) {
        //             var universe = parseInt(parseInt(i) / 512);

        //             if(node.preparedChannels[i].value != node.currentOutput[i]) {changed = true;}

        //             //var updatesPerMS = node.preparedChannels[i].changes * ((node.preparedChannels.length / 10) / node.preparedChannels[i].fadeTime);
        //             node.preparedChannels[i].current += updatesPerMS;
        //             if(node.preparedChannels[i].current > node.preparedChannels[i].value && updatesPerMS > 0){node.preparedChannels[i].current = node.preparedChannels[i].value;}
        //             if(node.preparedChannels[i].current < node.preparedChannels[i].value && updatesPerMS < 0){node.preparedChannels[i].current = node.preparedChannels[i].value;}
        //             node.artnet.setChannel(node.universeId + universe, parseInt(i) - (512 * universe), node.preparedChannels[i].current);
        //         }

        //         if(!changed){node.fade = false; node.preparedChannels = [];}
        //     }
        // }, 1);

        //Reset the universe
        node.reset = () => {
            //clearInterval(node.channelFadeHandler);
            node.artnet.resetUniverse(artnetIds);
        }

        //On close do some clean up
        node.on("close", () => {
            //clearInterval(node.channelFadeHandler);
        });

        //Send the channels stored in the prepared pool
        node.sendChannels = () => {
            node.fade = true;
        };
    }

    RED.nodes.registerType("artnet-universe", Universe);
}