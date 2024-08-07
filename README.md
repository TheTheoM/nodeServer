# Node WebSocket Server + React Interface BETA

Node based WebSocket server. Devices are represented as 'nodes' with inputs and outputs connectable via links to other node IO's. 

![image](https://github.com/TheTheoM/nodeServer/assets/103237702/cb0113df-60a5-44d3-ad96-f09925294ba7)
^ React-Web-Interface ^. 

Supports:
* Live Updating Widgets (Int/Text Inputs, sliders, checkboxes, toggles, stylable icons, text displaying)
* Link Data Inspection
* Persistent Links (Will reconnect after disconnection or server restart)
* Optional Static Link Data Typing 
* Experimental Key exchange for RSA (Beta)
* Device Logging
* Optional Cyberpunk Styling
  
### Installation 
#### 1. Clone this repository:
```
git clone https://github.com/TheTheoM/nodeServer.git
```
```
cd nodeServer
```
#### 2. Installing packages for server.js:
```
npm install
```    
#### 3. Run the server:
```
node server.js
```
#### 4. In a new terminal, move into the reactInterface folder:
```
cd reactInterface
```
#### 5. [OPTIONAL] Replace "localhost" with your PC's IP address in the .env file if desired:
```
REACT_APP_WEBSOCKET_SERVER_IP=localhost:8080``` => ```REACT_APP_WEBSOCKET_SERVER_IP=192.168.255.255:8080
```
#### 6. Install dependencies for React Interface:
```
npm install
```
#### 7. Run React Interface:
```
npm run start
```

## High Level Overview:
- There are many fully functional example clients in /exampleClients, both in Python and JS.

### To Connect:
  1. Connect to the Server (server.js, port 8080) as a websocket client. You handle this. 
  2. You send a registration message to the Server with your device info. See [How to Register a Device](#registering-a-device)


### To send/receive Data:
  - If your device has outputs, it will send data to the server as needed. See [How to send Outputs](#Device-Outputting)
  - If your device has inputs, it will receive data from the server via incoming messages. See [How to receive Inputs?](#Device-Receiving-Inputs)

### Creating / managing Links:
  - A link routes data from an output to input. Can be created through the React GUI by 'drawing' connections between nodes or by using API calls.
  - There are two types of links: Temporary and Persistent, with the GUI defaulting to Persistent links.
    - Temporary Links 'break' or stop routing data after a device reconnection or server restart.
    - Persistent Links automatically reestablishes a data link, even after device disconnection or server restart.
  
  - See [How to Create a Link via API](#creating-link) for information on API calls to create, modify or destroy both links.

### Additional Capabilities:
  5.  Send logs, status, widgets etc.

## Example JS Client
```
const WebSocket = require("ws")

const deviceASocket = new WebSocket('ws://localhost:8080');

deviceASocket.addEventListener('open', () => {  //Registration Message
    console.log('DeviceA Connected To Server');
    deviceASocket.send(JSON.stringify({
        type:        "registerDevice",
        name:        "DeviceA",
        isNode:      true,
        inputNames:  ["wordInput"],
        outputNames: ["wordOutput"],
        deviceInfo:  "Example Device",
    }))
})

deviceASocket.addEventListener("message", (msg) => {
    let data = JSON.parse(msg.data)
    if (data.type === "sendInputs") { // The inputs send from the server to your device
        if (data.inputs.hasOwnProperty("wordInput")) {
            console.log(`DeviceA received input from input: "wordInput": ${data.inputs.wordInput}`)
        }
    } 
})


setInterval(() => { // Device A outputting
    deviceASocket.send(JSON.stringify({
        type: "sendOutputs",
        outputs: {
            "wordOutput": "Hello, World? Maybe Device B is my world?",
        },    
    }))
}, 200);
```

Other examples are in /exampleClients.

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
<a name="registering-a-device"></a>
- You *send* this to the server after initial connection, to tell it the device name, inputs outputs etc.
```
  {
    "type": "registerDevice"                     // [required]
    "name":  device_name,                        // [required] [string len > 0] ,
    "isNode": true,                              // [required] [boolean] [to be depracated],
    "inputNames": ["input_1", "input_N"],        // [required] [array of str len >= 0]  [For no inputs, leave as empty array "[]"]
    "outputNames": ["output_1", "output_N"],     // [required] [array of str len >= 0]  [For no outputs, leave as empty array "[]"]
    "deviceInfo": "Any infomation you want",     // [required] [string] 
    "widgets": [{..}, {}],                       // [optional] [array of dicts len > 0] [For syntax see "Widgets" below]
  }
```
#### Static Typing
By default, IO's are typeless, meaning any data type (int, float, string, boolean, typeless) can connect to them.
```
  "inputNames": ["input_1", "input_2", "input_3", "input_4", "input_5"],        
```
By converting the ioName array into a dictionary where each key represents a name and its corresponding value denotes the data type, connections can only be established between two elements of the same type or with a typeless destination. 

```
  "inputNames": {"input_1": "int", "input_2": "str", "input_3": "float", "input_4": "array", "input_5": "typeless"},        
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
<a name="creating-link"></a>

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
<a name="Device-Outputting"></a>
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
<a name="Device-Receiving-Inputs"></a>
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


## Future Improvements:

* Adding optional typing to IO ports, as to allow connections only of the same type to avoid incompatability. I.e. static types + automatic casting 
* Add password protection to access server
* User/admin roles
* 


