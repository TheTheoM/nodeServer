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
* Optional Cyberpunk Styling
  
## How to connect to the server: See Installation for this to work.

1. Run server.js:  ```node server.js```
2. Create a webSocket Client that connects to the server url.
3. Send a registeration message to the server.

## Installation
### 1. cd into the repo
### 2. ``` npm install . ```
### 3. ``` cd reactInterface ```
### 4. Create a new file called '.env' and enter the following:
```REACT_APP_WEBSOCKET_SERVER_IP=localhost:8080```
####         -Change localhost to PC IP if you wish.
### 5. ``` npm install .```

## Running nodeServer:
``` node server.js ``` From root directory of the repo
## Running react Website:
``` cd reactInterface ```

``` npm run start ```

# API Reference:

To send any message to the server, you'd send a JSON encoded dictionary which always has a "type" and required arguments for said type, for example:
{
"type": commandName,
"arg_1": val,
"arg_N": val,
}

## What you need for connecting to the server:

### Registering a Device:

- You send this to the server after connection, to tell it the device name, inputs outputs etc.
```
{
"type": "registerDevice"                     // [required]
"name":  device_name,                        // [string len > 0] [required],
"isNode": true,                              // [boolean] [required] [to be depracated],
"inputNames": ["input_1", "input_N"],        // [array of strings len >= 0] [required] [For no inputs, leave as empty array "[]"]
"outputNames": ["output_1", "output_N"],     // [array of strings len >= 0] [required] [For no outputs, leave as empty array "[]"]
"deviceInfo": "Device B",                    // [string] [required]
"widgets": {{..}, {}}                        // [array of dictionaries len > 0] [optional] [For syntax see "Creating Widgets"]
"supportedEncryptionStandards": {{..}, {}},  // [array of dictionaries len > 0] [optional] [for syntax see "Encryption"]
}
```



