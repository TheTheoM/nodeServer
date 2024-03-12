# Node WebSocket Server + React Interface

This server represents devices as nodes, which inputs and outputs which can be linked together through a GUI or API calls. This server is ideal for hightly technical 'smart-home' concepts, where any aritary webSocket client can be a node, and linked to others. This allows for reprogramming extraordinarily quickly, avoiding the tedious programming required to otherwise link nodes together.

![image](https://github.com/TheTheoM/nodeServer/assets/103237702/cb0113df-60a5-44d3-ad96-f09925294ba7)
A screenshot of the React-Web-Interface for this server. 


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

# Installation:

### Ensure Node is installed and download this entire repository. 

## Starting the nodeServer:
### 1. cd into the repo. You should see a 'package.json' file and a 'server.js'
### 2. Install Required Packages for the server: [ONE-TIME STEP]
``` npm install ```
### 4. Start the Server (Note: May raise an error about a file not existing, ignore it. It will create the log-file).
``` node server ```

## How to Start the React Web-Interface:
        ### 1. cd into the reactInterface folder
        ### 2. Create a new file called '.env' and enter the following: [ONE-TIME STEP]
        ```REACT_APP_WEBSOCKET_SERVER_IP=localhost:8080```
        REACT_APP_WEBSOCKET_SERVER_IP is an react environmental variable, telling it to communicate with the nodeServer at localhost:8080. 
        #### Note 1: If you want to access this server from devices other than your machine, you will need to replace localhost with your machines-ip, and ensure firewalls not blocking it.
        #### Note 2: Changing env variables requires restarting the interface via step 4 to take affect.
        
        ### 3. Install Required Packages for the react app: [ONE-TIME STEP]
        ``` npm install ```
        ### 4. Start the react interface
        ``` npm run start ```
        
        ## After completing this steps succesfully, all needed to run this again is:
        ``` node server ```
        ``` cd reactInterface```
        ``` npm run start ```

