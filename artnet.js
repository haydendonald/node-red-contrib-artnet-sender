module.exports = function(RED)
{
    var dmxlib = require('dmxnet');
    var dmxnet = undefined;
    var universes = {};

    //Main Function
    function Artnet(config)
    {
        RED.nodes.createNode(this, config);
        var node = this;
        node.name = config.name;
        if(dmxnet == undefined) {
            dmxnet = new dmxlib.dmxnet({
                log: {
                    "level": config.log
                },
                oem: config.oem,
                sName: config.sName,
                lName: config.lName
            });    
        }

        //Add a new universe, returns an id that should be used to interface with each universe
        node.addUniverse = (options) => {
            var uniId = parseInt(options.universe) + (parseInt(options.subnet) * 16) + (parseInt(options.net) * 256);
            if(universes[uniId] !== undefined) {
                return uniId;
            }
            else {
                universes[uniId] = {
                    "sender": dmxnet.newSender(options),
                    "receiver": dmxnet.newReceiver({
                        "subnet": options.subnet,
                        "universe": options.universe,
                        "net": options.net
                    }),
                };

                return uniId;
            }
        };

        //Add a listener to updated channel information
        node.addDataListener = (universeId, func) => {
            universes[universeId].receiver.on("data", func);
        }

        //Set a channel to the universe
        node.setChannel = (universeId, channel, value) => {
            universes[universeId].sender.setChannel(channel, value);
        };

        //Reset a universe
        node.resetUniverse = (universeId) => {
            universes[universeId].sender.reset();
        };
    }

    RED.nodes.registerType("artnet-artnet", Artnet);
}