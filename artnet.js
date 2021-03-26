module.exports = function(RED)
{
    var dmxlib = require('dmxnet');
    
    //Main Function
    function Artnet(config)
    {
        RED.nodes.createNode(this, config);
        var node = this;
        node.name = config.name;
        var dmxnet = new dmxlib.dmxnet({
            log: {level: config.log},
            oem: config.oem,
            sName: config.sName,
            lName: config.lName
        });

        var universes = [];

        //Add a new universe, returns an id that should be used to interface with each universe
        node.addUniverse = (options) => {
            universes.push({
                "sender": dmxnet.newSender(options),
                "receiver": dmxnet.newReceiver({
                    "subnet": options.subnet,
                    "universe": options.universe,
                    "net": options.net
                }),
            });
            return universes.length - 1;
        };

        //Add a listener to updated channel information
        node.addDataListener = (universeId, func) => {
            universes[universeId].receiver.on("data", func);
        }

        //Set a channel to the universe
        node.setChannel = (universeId, channel, value) => {
            universes[universeId].sender.prepChannel(channel, value);
        };

        //Transmit
        node.transmit = (universeId) => {
            universes[universeId].sender.transmit();
        };

        //Reset a universe
        node.resetUniverse = (universeId) => {
            universes[universeId].sender.reset();
        };
    }

    RED.nodes.registerType("artnet-artnet", Artnet);
}