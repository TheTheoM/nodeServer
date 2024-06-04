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
## High Level Overview:

1. Connect to the Server as a websocket client. You handle this.
2. Send a registration message to the Server.
3. Send your device's Outputs to the Server
4. Receive messages from your device's Inputs to the Server
5. Optionally send logs, status, widgets etc.
   



## What you need for connecting to the server:

### Registering a device "registerDevice":
- You *send* this to the server after initial connection, to tell it the device name, inputs outputs etc.
```
{
  "type": "registerDevice"                     // [required]
  "name":  device_name,                        // [required] [string len > 0] ,
  "isNode": true,                              // [required] [boolean] [to be depracated],
  "inputNames": ["input_1", "input_N"],        // [required] [array of str len >= 0]  [For no inputs, leave as empty array "[]"]
  "outputNames": ["output_1", "output_N"],     // [required] [array of str len >= 0]  [For no outputs, leave as empty array "[]"]
  "deviceInfo": "Device B",                    // [required] [string] 
  "widgets": [{..}, {}],                       // [optional] [array of dicts len > 0] [For syntax see "Widgets" below]
  "supportedEncryptionStandards": [{..}, {}],  // [optional] [array of dicts len > 0] [for syntax see "Encryption" below]
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
           'keyPair': {key: newValue}, /// [The key is from the widget creation e.g. value, values, style e.g. {"value": 10}]
        }
      ```


## I'm connected to the server, now what?
#### How data is routed?
  - Given Device A's outputs is connected to Device B's inputs, Device A sends its output data to the server, which then sends it to Device B.
  - Device A -> Server ->  Device B
    
  1. A Data Link must be created between two devices. This can be done through two ways:
     a. Temporary Link: "requestLink"
       - The link will break on device disconnection or server restart.
       - Creating the Link: "requestLink"
       - Breaking the Link: "breakLink"
           - ```
             {
               'type': 'requestLink' or 'breakLink',
               'outputDeviceName': "deviceA",          // [Required]
               'outputName':       "output IO name",   // [Required]
               'inputDeviceName':  "deviceB",          // [Required]
               'inputName':        "input IO name",    // [Required]
              }
           ```
     
     b. Persistent Link:  "requestPersistentLink"
        - The link will persist and reestablish itself upon device reconnection and server restart.
           - To Create a Link use type "requestPersistentLink":
           - To break an already created link use type "breakPersistentLink":
              - ```
                 {
                   'type': 'requestPersistentLink' or 'breakPersistentLink',
                   'outputDeviceName': "deviceA",          // [Required]
                   'outputName':       "output IO name",   // [Required]
                   'inputDeviceName':  "deviceB",          // [Required]
                   'inputName':        "input IO name",    // [Required]
                  }
               ```
          - Updating/modifying the Link TODO. Update the API for this as well.:
  
  2. A Device outputs a message:
     - Every time your device wants to output something to one or more of its output, you send this to the server which then routes it to the input of a connected device.
    - You can send any JSON serializable data: str, int, array, dict, ... etc.
    #### Send Outputs "sendOutputs"
    - ```
      {
        "type": "sendOutputs",
        "outputs": {
            "outputName_1": outputedValue_1, 
            "outputName_N": outputedValue_N,  
        }
      }
      ```
  3. A device receives a message through its input 
     - When device A outputs a message to Device B, the server will send the outputted messaged to Device B.
     - ```
       {
         "type": "sendInputs",
          "inputs": {
             "inputName_1": "inputtedValue_1",
             "inputName_N": "inputtedValue_N",--
           }
       }
       ```
#### 3. Send Logs        "sendLogs"
- You can send logs to the server, which are visible in the Logging Panel in the react interface. The server stores them in a JSON file, so logs persitent through disconnections and server restarts untill the JSON file fills up.
- ```
    {
        type: "sendLogs",
        logs: "log message", [required] [str len > 0]
        logType: "error",    [required] ["error", "fault", "info", "success"]
    }
  ```
#### 4. Change Status    "changeStatus"
- You can send logs to the server, which are visible in the Logging Panel in the react interface. The server stores them in a JSON file, so logs persitent through disconnections and server restarts untill the JSON file fills up.
- ```
    {
        type: "changeStatus",
        statusState: "error",  [required] ["offline", "online", "alert", "fault", "criticalFault"]
    }
  ```



