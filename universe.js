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
        var artnet = RED.nodes.getNode(config.artnet);
        var artnetId;

        var statusCallbacks = [];
        var currentOutput = [];
    
        //Add callbacks for status information
        node.addStatusCallback = function(func) {statusCallbacks.push(func);}
        node.updateStatus = function(color, message) {
            for(var i in statusCallbacks) {
                statusCallbacks[i](color, message);
            }
        }

        //Add this universe
        artnetId = artnet.addUniverse({
            "ip": node.ipAddress,
            "subnet": node.subnet,
            "universe": node.universe,
            "net": node.net,
            "port": node.port,
            "base_refresh_interval": node.refresh
        });

        //Add listener to self to store current artnet data
        artnet.addDataListener(artnetId, (data) => {
            currentOutput = data;
        });
    }

    RED.nodes.registerType("artnet-universe", Universe);
}