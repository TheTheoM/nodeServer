# Node WebSocket Server

This server represents devices as nodes, which inputs and outputs which can be linked together through a GUI or API calls. This server is ideal for hightly technical 'smart-home' concepts, where any aritary webSocket client can be a node, and linked to others. This allows for reprogramming extraordinarily quickly, avoiding the tedious programming required to otherwise link nodes together.

## How to connect to the server:

1. Create a webSocket Client that connects to the server url.
2. Send a registeration message to the server.

A simple registeration message for a device with one input and output.

```js
deviceASocket.send(JSON.stringify({
        type: "registerDevice",
        name: "DeviceA",
        isNode: true,
        inputNames: ["wordInput"],
        outputNames: ["wordOutput"],
        deviceInfo: "Example Device",
    }))
```
