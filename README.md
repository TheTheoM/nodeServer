# Node WebSocket Server + React Interface BETA

Node based WebSocket server. Devices are represented as 'nodes' with inputs and outputs connectable with 'links' to other node IO's. 

![image](https://github.com/TheTheoM/nodeServer/assets/103237702/cb0113df-60a5-44d3-ad96-f09925294ba7)
^ React-Web-Interface ^. 

Supports:
* Live Updating Widgets (Int/Text Inputs, sliders, checkboxes, toggles, stylable icons, text displaying)
* Link Data Inspection
* Persistent Links (Will reconnect after disconnection or server restart)
* Experimental Key exchange for RSA (Beta)
* Device Logging
  
## How to connect to the server: See Installation for this to work.

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

## Installation
### 1. cd into the repo
``` npm install . ```
### 2. ``` cd reactInterface ```
### 3. Create a new file called '.env' and enter the following:
```REACT_APP_WEBSOCKET_SERVER_IP=localhost:8080```
####         -Change localhost to PC IP if you wish.
### 4. Install Required Packages for the react app:
``` npm install .```

## Running nodeServer:
``` node server.js ``` From root directory of the repo
## Running react Website:
``` cd reactInterface ```
``` npm run start ```


