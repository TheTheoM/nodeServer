# Node WebSocket Server

This server represents devices as nodes, which inputs and outputs which can be linked together through a GUI or API calls. This server is ideal for hightly technical 'smart-home' concepts, where any aritary webSocket client can be a node, and linked to others. This allows for reprogramming extraordinarily quickly, avoiding the tedious programming required to otherwise link nodes together.

![image](https://github.com/TheTheoM/nodeServer/assets/103237702/cb0113df-60a5-44d3-ad96-f09925294ba7)
A screenshot of the React-Web-Interface for this server. This is not included in this repo, but this image is for illustrative purposes.


## How to connect to the server:

1. Run server.js:  ```node server.js```
2. Create a webSocket Client that connects to the server url.
3. Send a registeration message to the server.


A simple registeration message for a device with one input and output. Note: A complete example, including webSocket functionality, is in the examples folder.

```js
ws.send(JSON.stringify({
        type: "registerDevice",
        name: "DeviceA", 
        isNode: true,
        inputNames: ["wordInput"],
        outputNames: ["wordOutput"],
        deviceInfo: "Example Device",
    }))
```

To request a link, from 'wordOutput' to another device, DeviceB's output "wordOutput", simply send to the server: 

```js
ws.send(JSON.stringify({
        type:             "requestLink",
        outputDeviceName: "DeviceA",
        outputName:       "wordOutput",
        inputDeviceName:  "DeviceB",
        inputName:        "wordInput",
    }))
```
