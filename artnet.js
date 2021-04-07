const universe = require('./universe');

module.exports = function(RED)
{
    var dmxlib = require('dmxnet');
    var dmxnet = undefined;
    var universes = {};
    var universeSenders = [];

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
        node.addUniverse = (options, incomingDataHandler) => {
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
                    "transmitter": setInterval(function() {
                        universes[uniId].sender.transmit();
                    }, 1)
                };

                //Send channel updates
                universes[uniId].receiver.on("data", function(data) {
                    for(var i = 0; i < data.length; i++) {
                        if(universes[uniId].sender.values[i] != data[i]) {
                            incomingDataHandler(uniId, data);
                            break;
                        }
                    }
                });

                return uniId;
            }
        };

        //Set a channel to the universe
        node.setChannel = (universeId, channel, value) => {
            universes[universeId].sender.prepChannel(channel, value);            
        };

        node.getChannel = (universeId, channel) => {
            return universes[universeId].sender.values[channel] === undefined ? 0 : universes[universeId].sender.values[channel];
        }

        //Reset a universe
        node.resetUniverse = (universeId) => {
            universes[universeId].sender.reset();
            clearInterval(universes[universeId].transmitter);
        };
    }

    RED.nodes.registerType("artnet-artnet", Artnet);
}