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

All messages sent to and from the server are in the same basic JSON encoded structure, a "type" key which indicated what command and arguments for said command for example:
```
{
  "type": commandName,
  "arg_1": val,
  "arg_N": val,
}
```
## What you need for connecting to the server:

### "registerDevice":
- You *send* this to the server after initial connection, to tell it the device name, inputs outputs etc.
```
{
  "type": "registerDevice"                     // [required]
  "name":  device_name,                        // [required] [string len > 0] ,
  "isNode": true,                              // [required] [boolean] [to be depracated],
  "inputNames": ["input_1", "input_N"],        // [required] [array of strings len >= 0]  [For no inputs, leave as empty array "[]"]
  "outputNames": ["output_1", "output_N"],     // [required] [array of strings len >= 0]  [For no outputs, leave as empty array "[]"]
  "deviceInfo": "Device B",                    // [required] [string] 
  "widgets": [{..}, {}],                        // [optional] [array of dictionaries len > 0] [For syntax see "Creating Widgets"]
  "supportedEncryptionStandards": [{..}, {}],  // [optional] [array of dictionaries len > 0] [for syntax see "Encryption"]
}
```

- Upon sending this to the server, you will *receive*  one of two messages:
  1. "nameTaken" [failure]
      ```
        {
          type: "nameTaken",
          proposedName: newName,
        }
      ```
        - For example, if your taken name is "Bob", your proposed name will be "Bob-1", which is free at the time of message.
        - After a new name, resend the registration message.

  3. "connected" [success]
      ```
      {
        type: "connected",
      }
      ```
      - Receiving this indicates succesful registration. To see what you can now do see "I'm connected to the server, now what?"


#### Widgets:
- These are items that will appear on the node on the GUI, allowing control of the device without connecting another to it. Widgets can only be added in registration currently. Widgets can be live updated by its device any time after registration.

- Syntax:
```
 {"widgets": [
      {
       "widgetName": "uniqueName", // [string len > 0, used to identify the widget]
       "widgetType": "slider",     // [One of the below List.] 
       "value": 0,                 // [Initial Value for all, or icon name for "displayIcon"]
       "values": ["0", "200"],     // [Values for dropdown, Range for sliders, alternative values for toggle, unused for all else.]
       "style": {                  // [Optional CSS styles applied only to displayIcon] 
         "cssStyleName": "styleValue",
       },
      {...}
    },]
  }
```
- Widget Types:
     - "dropDown"    [Drop down menu]
     - "toggle"      [togglee switch]
     - "slider"      [integer slider]
        - Has an Instant Mode Checkbox: When checked, the device receives continuous updates as the slider moves. When unchecked, the device only receives          the final value once the slider stops moving
     - "number"      [integer text-input box]
     - "text"        [string text-input box]
     - "displayIcon" [Display an icon from a prechosen list, with provided optional css styling].

- Updating Widget Value:
    - Sent after registeration, from device to server.
      ```
        {
           'type': 'updateWidgetsKeyPair',
           'widgetName': widgetName,
           'keyPair': {key: newValue}, /// [The key is from the widget creation e.g. value, values, style]
        }
      ```







### I'm connected to the server, now what?

