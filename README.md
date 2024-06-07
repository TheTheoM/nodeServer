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
  
### Installation [One-Time]
#### 1. ``` cd <repository_name>```
#### 2. ``` npm install . ```
#### 3. ``` cd reactInterface ```
#### 4. Create a new file inside reactInterface called '.env' inside and enter:
```REACT_APP_WEBSOCKET_SERVER_IP=localhost:8080```
  - Change "localhost" to your PC's IP if you wish. 
  - Note: Creating the file via text redirection echo "" > didn't work with react for me.
#### 5. ``` npm install .```

### Running React GUI:
``` cd reactInterface ```
``` npm run start ```

### Running nodeServer:
``` node server.js ``` From root directory of the repo

## High Level Overview:
- There are fully functional example clients in /exampleClients.

### To Connect:
  1. Connect to the Server (server.js, port 8080) as a websocket client. You handle this. 
  2. You send a registration message to the Server with your device info. See **Registering a device**

### To send/receive Data:
  - If your device has outputs, it will send data to the server as needed. See **Device Send Outputs**
  - If your device has inputs, it will receive data from the server via incoming messages. See **Device Receiving Inputs**

### Creating / managing Links:
  - A link routes data from an output to input. Can be created through the React GUI by 'drawing' connections between nodes or by using API calls.
  - There are two types of links: Temporary and Persistent, with the GUI defaulting to Persistent links.
    - Temporary Links 'break' or stop routing data after a device reconnection or server restart.
    - Persistent Links automatically reestablishes a data link, even after device disconnection or server restart.
  
  - See **Creating a Link** for information on API calls to create, modify or destroy both links.

### Additional Capabilities:
  5.  Send logs, status, widgets etc.

# API Reference:

All messages sent to and from the server are in the same basic JSON encoded structure, a "type" key which indicated what command and arguments for said command for example:
```
{
  "type": commandName,
  "arg_1": val,
  "arg_N": val,
}
```

## Registering a device:
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

#### Upon sending this to the server, you will *receive* one of two messages:
  1. "nameTaken" [failure]
      ```
        {
          type: "nameTaken",
          proposedName: newName,
        }
      ```
        - For example, if your taken name is "Bob", your proposed name will be "Bob-N" e.g "Bob-1", which is free at the time of message.
        - After a new name, resend the registration message.

  3. "connected" [success]
      ```
        {
          type: "connected",
        }
      ```
      - Receiving this indicates succesful registration. To see what you can now do see "I'm connected to the server, now what?"

#### Widgets:
<img align="right" width="130px" height="130px"  src="https://github.com/TheTheoM/nodeServer/assets/103237702/b94e4bcc-53bb-4ca9-8063-efc6bf9c672f">
- These are items that will appear on the node on the GUI, allowing control of the device without connecting another to it. 
- Widgets can only be added in registration currently. Widgets can be live updated by its device any time after registration.
For example, see the integer slider and icon on the Node ->.
<br />
<br clear="right"/>

- Syntax:
  ```
   {registration...,
     "widgets": [
        {
         "widgetName": "uniqueName", // [string len > 0, used to identify the widget]
         "widgetType": "slider",     // [One of the below List.] 
         "value": 0,                 // [Initial Value for all, or icon name for "displayIcon"]
         "values": ["0", "200"],     // [Values for dropdown, Range for sliders, alternative values for toggle, unused for all else.]
         "style": {                  // [Optional CSS styles applicable only for widgetType "displayIcon"] 
           "cssStyleName": "styleValue",
           "cssStyleName": "styleValue",
         },
        {...},
      ]
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
    - The keyPair consists of keys from the widgets section of the registration message and their corresponding new values.
      ```
        {
           'type': 'updateWidgetsKeyPair',
           'widgetName': widgetName,
           'keyPair': {key: newValue}, // [The key is from the widget creation, e.g., "value", "values", "style" such as {"value": 10}]
        }
      ```

## Creating a Link:
  - Given Device A's output is connected to Device B's input, Device A sends its output data to the server, which then sends it to Device B.
  - So Data flows like this: Device A -> Server -> Device B
  - There are two types of Data Links:
    
  1. Temporary Link:
     
     - The link will break on device disconnection or server restart.
     - When creating a link, use type: "requestLink" when breaking it, type: "breakLink".
     ```
      {
        'type': 'requestLink' or 'breakLink',
        'outputDeviceName': "deviceA",          // [Required]
        'outputName':       "output IO name",   // [Required]
        'inputDeviceName':  "deviceB",          // [Required]
        'inputName':        "input IO name",    // [Required]
     }
     ```
  
  3. Persistent Link:
     
     - This link will persist and reestablish itself upon device reconnection and server restart.
     - When creating a link, use type: "requestPersistentLink" when breaking it, type: "breakPersistentLink".
       ```
       {
         'type': 'requestPersistentLink' or 'breakPersistentLink',
         'outputDeviceName': "deviceA",          // [Required]
         'outputName':       "output IO name",   // [Required]
         'inputDeviceName':  "deviceB",          // [Required]
         'inputName':        "input IO name",    // [Required]
       }
       ```

## Device Outputting:
  - Every time your device wants to output something to one or more of its output, you send this to the server which then routes it to the input of a connected device.
  - You can send any JSON serializable data: str, int, array, dict, ... etc.
  - ```
      {
        "type": "sendOutputs",
        "outputs": {
        "outputName_1": outputedValue_1, 
        "outputName_N": outputedValue_N,  
        }
      }
    ```

## Device Receiving Inputs:
  - When device A outputs a message to Device B, the server will send the outputted messaged to one of Device B's inputs.
  - Received message from server:
    - ```
        {
            "type": "sendInputs",
            "inputs": {
            "inputName_1": "inputtedValue_1",
            "inputName_N": "inputtedValue_N",
          }
        }
      ```
## Additional Capabilities 
  ### Send Logs "sendLogs"
  - You can send logs to the server, which are visible in the Logging Panel in the react interface. The server stores them in a JSON file, so logs persitent through disconnections and server restarts untill the JSON file fills up.
  - ```
    {
      type: "sendLogs",
      logs: "log message", [required] [str len > 0]
      logType: "error",    [required] ["error", "fault", "info", "success"]
    }
    ```
  ### Changing Device Status "changeStatus"
  - You can send logs to the server, which are visible in the Logging Panel in the react interface. The server stores them in a JSON file, so logs persitent through disconnections and server restarts untill the JSON file fills up.
  - ```
      {
          type: "changeStatus",
          statusState: "error",  [required] ["offline", "online", "alert", "fault", "criticalFault"]
      }
    ```



