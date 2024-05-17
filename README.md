# Node WebSocket Server + React Interface BETA

This server represents devices as nodes, which inputs and outputs which can be linked together through a GUI or API calls. This server is ideal for hightly technical 'smart-home' concepts, where any arbitrary webSocket client can be a node, and linked to others. This allows for reprogramming extraordinarily quickly, avoiding the tedious programming required to otherwise link nodes together.

![image](https://github.com/TheTheoM/nodeServer/assets/103237702/cb0113df-60a5-44d3-ad96-f09925294ba7)
A screenshot of the React-Web-Interface for this server. 

In essense, I created this because I wanted a slick, easy interface for connecting devices together with  logging, widgets, a status bar and with the ability to see the data being transmitted. I didn't like having to program connecting devices together every time I made a new device pretty much. 

For example, A Python Device named 'G-Keys' (shown above) was designed to detect input from the six macro keys on my keyboard. This device outputs to 'RCVR,' a speaker amplifier. When three specific keys are pressed, corresponding actions are triggered: volume up, volume down, or muting commands, respectively. If I want to change which keys do that, its a matter of just drawing the connection. Easy right?

I also made it with two themes, one normal and one cyberpunky, I will need to add the button to do so, but currently its toggled by a isCyber variable in some react components.

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
### 3. Create a new file called '.env' and enter the following: [ONE-TIME STEP]
```REACT_APP_WEBSOCKET_SERVER_IP=localhost:8080```
####         -Change localhost to PC IP if you wish.
### 4. Install Required Packages for the react app: [ONE-TIME STEP]
``` npm install .```

## Running nodeServer:
``` node server.js ``` From root directory of the repo
## Running react Website:
``` cd reactInterface ```
``` npm run start ```


