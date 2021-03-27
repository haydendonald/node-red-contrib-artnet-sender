# Panasonic Projector Control for NodeRed
This project provides sending of DMX data over multiple universes using Artnet via [dmxnet](https://github.com/margau/dmxnet) by margau.

## Currently under development!
This project is currently under development and is not ready for use.

# Nodes
## Universe
Provides access to a universe
#### Options
- ```Name``` the flow visible name
- ```IPAddress``` is the IP address of the artnet node to send to. Default is ```255.255.255.255``` (broadcast)
- ```Port``` the Artnet port
- ```Subnet``` the Artnet subnet to send to
- ```Universe``` the Artnet universe to send to
- ```Net``` the Artnet net to send to
- ```Refresh Interval``` the refresh interval for sending unchanged DMX values

## Output
Provides a place to send Artnet data to.
### Options
- ```Name``` the flow visible name
- ```Universe``` the universe to send to (This is a universe node seen above)

### Input Payload
The following is the basic format expected for input to the output node
```
{
    "payload": {
        "channels": {
            1: {value: 255, fadeTime: 5000}, //The channel 1 to value 255 with a fade time of 5 seconds
            230: {value: 10} //Channel 230 to value 10 with the default fadeTime set below
        },

        "fadeTime": 1000 // The fade time for all channels that don't have a specific fadeTime set
    }
}
```
Just sending a empty payload will have the node output it's current set channel values in the same format above

However the universe can be also reset to 0 by sending the following
```
{
    "topic": "reset"
}
```


# Version
## 1.0.0
* First release!
    * Supports multiple universes
    * Supports basic channel outputs with fade time