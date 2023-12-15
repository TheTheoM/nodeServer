const WebSocket = require('ws');
const EventEmitter = require('events');
const { PassThrough } = require('stream');
const { error, Console } = require('console');
const fs = require('fs');

//need to discon repeat names

class VariableWatcher extends EventEmitter {
  constructor(preventDuplicateValue) {
    super();
    this.variable = null;
    this.preventDuplicateValue = preventDuplicateValue
  }

  setVariable(value) {
    if (this.preventDuplicateValue) {
        if (this.variable !== value) {
          this.variable = value;
          this.emit('change', value);
        }
    } else {
        this.variable = value;
        this.emit('change', value);
    }
  }
}

class SERVER {
    constructor(port, reactClientName, savedLinkFiles) {
        this.server = new WebSocket.Server({ port: port, pingInterval: 5000,   pingTimeout: 1000 });
        this.activeLinks = this.createObservableMap();
        this.deviceLogs = this.createObservableLog();
        this.reactClientName = reactClientName;
        this.savedLinkFiles = savedLinkFiles;
        this.connectedDevices = new Map();
        this.persistentLinks = new Map();
        this.sendReactUpdate = true;
        this.logFilters = {selectedDevices: [], time: ["from", "to"], alerts: ["warning", "error", "info", "success"], search: ""};
        this.serverContext = this;
        this.serverLogVirtDevice;
        this.printLogs = true;
        this.sendUpdate = true;
        this.pingTimeout = 1500;
        this.main()
    }

    main() {
        this.serverLogVirtDevice = this.createVirtualDevice("Server", {}, {})

        this.server.on('connection', (socket) => {
            this.addLog("Device: Device connected.", "info")

            socket.on('message', (msg) => {
                msg = JSON.parse(msg)
                if (msg.type === "registerDevice") {
                    this.addLog(`Device: ${msg.name} registered.`, "info")
                    let device = new DEVICE(socket, this.serverContext, msg.name, msg.inputNames, msg.outputNames, msg.deviceInfo, msg.widgets, msg.isNode)
                    if (device.name === this.reactClientName) {
                        device.sendMessage(
                            JSON.stringify({
                                type: "linkMapUpdate",
                                activeLinks: this.getActiveLinkInfo(),
                            })
                            );
                    }
                    this.connectedDevices.set(device.name, device)
                    this.checkForPersistentLink();
                    this.checkDeviceSavedData()
                }
            })


        })
    }

    createObservableMap() {
        const map = new Map();
        const listeners = new Set();

        const update = () => {
            if (this.sendReactUpdate) {
              let reactDevice = this.connectedDevices.get(this.reactClientName);
              if (reactDevice) {
                reactDevice.sendMessage(
                  JSON.stringify({
                    type: "linkMapUpdate",
                    activeLinks: this.getActiveLinkInfo(),
                  })
                );
              }
            }
          };
          
      
        const set = (key, value) => {
            map.set(key, value);
            update()
          return map;
        };
      
        const get = function (key) {
            return map.get(key);
        };
      
        const deleteItem = function (key) {
            let item = map.delete(key)
            update()
            return item;
        };
      
        const has = function (key) {
          return map.has(key);
        };
      
        const forEach = function (callback) {
          map.forEach(callback);
        };
      
        return {
          set,
          get,
          deleteItem,
          has,
          forEach,
        };
    }

    createObservableLog() {
        const map = new Map();
        const listeners = new Set();

        const update = () => {
            if (this.sendReactUpdate) {
              let reactDevice = this.connectedDevices.get(this.reactClientName);
              if (reactDevice) {
                reactDevice.sendMessage(
                  JSON.stringify({
                    type: "getLogs",
                    deviceLogs: this.getDeviceLogs(),
                  })
                );
              }
            }
          };
          
      
        const set = (key, value) => {
            map.set(key, value);
            update()
          return map;
        };
      
        const get = function (key) {
            return map.get(key);
        };
      
        const deleteItem = function (key) {
            let item = map.delete(key)
            update()
            return item;
        };
        const has = function (key) {
          return map.has(key);
        };
      
        const forEach = function (callback) {
          map.forEach(callback);
        };
      
        return {
          set,
          get,
          deleteItem,
          has,
          forEach,
        };
    }

    modifyFilters(filters) {
        for (const key of Object.keys(filters)) {
            if (true) {
                this.logFilters[key] = filters[key]
            } else {
                // Log The error.
            }
        }

    }

    addLog(log, logType) {
        let device = this.connectedDevices.get("Server")

        if (device) {
            device.addLog(log, logType)            
        } 

        if (this.printLogs) {console.log(log)}
    }

    saveNodePositions(nodePositions) {
        try {
            let fileData = fs.readFileSync(this.savedLinkFiles, 'utf-8');
            let parsedData = JSON.parse(fileData);
            
            if (typeof parsedData.deviceData === 'undefined' || parsedData.deviceData) {
                console.log('runs')
                parsedData["deviceData"] = {}
            }

            let deviceData = parsedData.deviceData

            nodePositions.forEach((nodeData) => {
                let device = this.connectedDevices.get(nodeData.name)
                if (device) {
                    deviceData[nodeData.name] = {"position": nodeData.position}
                    device.setPosition(nodeData.position)
                }
            })
            fs.writeFileSync(this.savedLinkFiles, JSON.stringify(parsedData, null, 2), 'utf-8');
        } catch (error) {
            this.addLog('Error parsing existing file content:'  + error, "error");
        }

    }

    checkDeviceSavedData() {
        try {
            const fileData = fs.readFileSync(this.savedLinkFiles, 'utf-8');
            const parsedData = JSON.parse(fileData);
            if (parsedData["deviceData"]) {
                Object.keys(parsedData["deviceData"]).forEach((deviceName) => {
                    let device = this.connectedDevices.get(deviceName)
                    if (device) {
                        device.setPosition(parsedData["deviceData"][deviceName]["position"])
                    }
                });
            }
        } catch (error) {
        this.addLog('Error reading JSON file:'+ error.message, "error");
        }
    }

    loadLinks() {
        try {
            const fileData = fs.readFileSync(this.savedLinkFiles, 'utf-8');
            const parsedData = JSON.parse(fileData);
            if (parsedData["links"]) {
                parsedData["links"].forEach((link) => {
                    this.addPersistentLink(link.outputDeviceName, link.outputName, link.inputDeviceName, link.inputName)
                });
            }
          } catch (error) {
            console.error('Error reading JSON file:', error.message);
          }
    }

    createVirtualDevice(name,inputs, outputs) {
        return new VIRTUALDEVICE(this.serverContext, name, inputs, outputs, "VirtualDevice")

    }

    requestLinkDataInspection(linkName) {
        let link = this.activeLinks.get(linkName)
        if (link) { 
            return link.getLastMessage()
        } else {
            this.addLog(`Link ${linkName} doesn't exist.`, "error")
        }

    }
      
    getDeviceIO() {
        let deviceInfo = {};

        for (const [name, device] of this.connectedDevices.entries()) {
            deviceInfo[name] = {
                name: device.name,
                inputs: device.inputs,
                outputs: device.outputs,
            }
        }

        return {
            devices: deviceInfo
        }
    }

    getIOObject(deviceName, IOname, isInput) {
        const device = this.connectedDevices.get(deviceName);
        if (!device) {
            // throw new Error(`Device ${deviceName} not found in getIOObject`);
            return false
        }
    
        if (isInput) {
            const input = device.inputs.get(IOname);
            if (!input) {
                this.addLog(`Device ${deviceName} doesn't have input: ${IOname}`, "error");
                return false;
            }
            return input;
        } else {
            const output = device.outputs.get(IOname);
            if (!output) {
                this.addLog(`Device ${deviceName} doesn't have output: ${IOname}`, "error");
                return false;
            }
            return output;
        }
    }

    getActiveLinkInfo() {
        let linkInfo = {}
        this.activeLinks.forEach(link => {
            linkInfo[link.name] = {
                isPersistent: link.isPersistent,
                outputDevice: link.outputDevice.name,
                inputDevice:  link.inputDevice.name,
                outputName:   link.outputDeviceObject.name,
                inputName:    link.inputDeviceObject.name,
                displayName:  link.displayName,
                name:         link.name,
                lastMessage:  null,
            }
        });
        return linkInfo
    }

    getAvailableIO() {
        let availableIO = {};
        this.connectedDevices.forEach((device, deviceName) => {
            availableIO[deviceName] = device.getAvailableIO()
        })
        return availableIO
    }

    getDeviceLogs() {
        let deviceLogs = [];
        let logFilters = this.logFilters;
        this.connectedDevices.forEach((device, deviceName) => {
            let localLog = device.getLogs()
            for (let log of localLog) {
                  if (logFilters.selectedDevices.includes(deviceName) && logFilters.alerts.includes(log.logType)) {
                    if (logFilters.search === "") {
                        deviceLogs.push(log)
                    }  else if (JSON.stringify(log).toLocaleLowerCase().includes(logFilters.search.toLocaleLowerCase())) {
                        deviceLogs.push(log)
                    }
                }
            }
        })

        deviceLogs.sort((logA, logB) => new Date(logA.time) - new Date(logB.time));

        return deviceLogs
    }
    
    requestLink(outputDeviceName, outputName, inputDeviceName, inputName, isPersistent) {
        let outputIOObject = this.getIOObject(outputDeviceName, outputName, false);
        let inputIOObject  = this.getIOObject(inputDeviceName,  inputName,  true );

        let outputDevice   = this.getDevice(outputDeviceName);
        let inputDevice    = this.getDevice(inputDeviceName);



        try {
            let proposedLinkName =  `${outputDevice.name}-${outputIOObject.name}=>${inputDevice.name}-${inputIOObject.name}`;
            if (outputIOObject && inputIOObject && !this.doesLinkExist(proposedLinkName)) {
                let link = new LINK(this.serverContext, outputIOObject, inputIOObject, outputDevice, inputDevice, isPersistent);
                link.activate();
                if (isPersistent) {
                    let existingFileContent = fs.readFileSync(this.savedLinkFiles, 'utf-8');
                    try {
                        let fileData = JSON.parse(existingFileContent);
                        let linkData = fileData.links;
                        if ((linkData.filter(link => link.linkName === proposedLinkName)).length === 0) {
                            let newLink = {
                                "linkName":         proposedLinkName,
                                "outputDeviceName": outputDevice.name,
                                "outputName":       outputIOObject.name,
                                "inputDeviceName":  inputDevice.name,
                                "inputName":        inputIOObject.name,
                            };
                            linkData.push(newLink);
                            let updatedFile = {
                                "links": linkData
                            };
                            fs.writeFileSync(this.savedLinkFiles, JSON.stringify(updatedFile, null, 2), 'utf-8');
                        }
                    } catch (error) {
                        console.error('Error parsing existing file content:', error);
                    }
                   
                }
                return link
            } else {
                return false
            }
          } catch (error) {
            this.addLog(`Error on outputDeviceName: ${outputDeviceName}    outputName: ${outputName}    inputDeviceName: ${inputDeviceName}    inputName: ${inputName}
            ${error}`, "error")
            return false
          } 
    }

    addPersistentLink(outputDeviceName, outputName, inputDeviceName, inputName) {
        let linkName = `${outputDeviceName}-${outputName}=>${inputDeviceName}-${inputName}`;
        let linkData = {
            "outputDeviceName": outputDeviceName,
            "outputName":       outputName,
            "inputDeviceName":  inputDeviceName,
            "inputName":        inputName,
        };
    
        // Add the link to the persistentLinks map
        this.persistentLinks.set(linkName, linkData);
        this.addLog(`Persistent Link: ${linkName}: Activating `, "info");
        this.checkForPersistentLink();
    

    }


    breakPersistentLink(outputDeviceName, outputName, inputDeviceName, inputName) {
        let linkName = `${outputDeviceName}-${outputName}=>${inputDeviceName}-${inputName}`
        if (this.persistentLinks.delete(linkName)) {
            this.addLog(`Persistent Link: ${linkName}:  Broken and Deactivating: `, "info")
            this.breakLinkWithIONames(outputDeviceName, outputName, inputDeviceName, inputName)
            let fileData = fs.readFileSync(this.savedLinkFiles, 'utf-8');
            try {
                const parsedData = JSON.parse(fileData);
                let deletedLinks = parsedData.links.filter(link => link.linkName !== linkName);
                let updatedFile = {
                    "links": deletedLinks
                };
                fs.writeFileSync(this.savedLinkFiles, JSON.stringify(updatedFile, null, 2), 'utf-8');
            } catch (error) {
                console.error('Error parsing existing file content:', error);
            }
        } else {
            this.addLog(`Persistent Link: ${linkName}: ERROR Not Found: `, "error")
        }
    }

    requestNodeLink(srcDevice, srcIOname, trgDevice, trgIOname) {
        this.requestLink(srcDevice, srcIOname, trgDevice, trgIOname)
    }

    doesLinkExist(linkName) {
        return this.activeLinks.has(linkName)
    }

    checkForPersistentLink() {
        this.persistentLinks.forEach((linkData, linkName) => {
            let inputDevice = this.connectedDevices.get(linkData.inputDeviceName);
            let outputDevice  = this.connectedDevices.get(linkData.outputDeviceName);

            if (inputDevice && outputDevice) {
   
                if (inputDevice.inputNames.has(linkData.inputName) && outputDevice.outputNames.has(linkData.outputName)) {
                    this.requestLink(linkData.outputDeviceName, linkData.outputName, linkData.inputDeviceName, linkData.inputName, true)
                    // Some issue with requestLink
                }
            }    
          });
    }

    breakLinkWithIONames(outputDeviceName, outputName, inputDeviceName, inputName) {
        let linkName = `${outputDeviceName}-${outputName}=>${inputDeviceName}-${inputName}`
        return this.breakLinkByName(linkName)
    }

    breakLinkByName(linkName) {
        let link = this.activeLinks.get(linkName);
        if (link) {
            link.deactivate()
            return false
        } else {
            this.addLog(`Deactivation failure. Link Name ${linkName} doesn't exist.`, "error")
            return false
        }
    }


    addDevice(DEVICE) {
        if (this.connectedDevices.get(DEVICE)) {
            throw `Device ${DEVICE.name} already exists`
        } else {
            this.connectedDevices.set(DEVICE.name, DEVICE)
        }
    }

    getDevice(deviceName) {
        return this.connectedDevices.get(deviceName);
    }

    removeDeviceByName(deviceName) {
        this.addLog("Attempts to disconnect " + deviceName, "info")

        this.activeLinks.forEach((link) => {
            if (link.outputDeviceObject.device.name === deviceName || link.inputDeviceObject.device.name === deviceName) {
                this.addLog("Link found.", 'info')
                link.deactivate()
            } else {
                this.addLog("Link not found.", "error")
            }
        })
        let device = this.connectedDevices.get(deviceName)
        if (device) {
            this.connectedDevices.get(deviceName).deactivate()
            this.connectedDevices.get(deviceName).ws.close()
        } else {
            this.addLog("Device not found.", "error")

        }
         if (this.connectedDevices.delete(deviceName)) {
            this.addLog(`Device: ${deviceName} Deleted.`, "info")
         } else {
            this.addLog("Device not deleted.", "error")
         }
    }

    sendMessageToDevice(deviceName, message) {
        let device = this.connectedDevices.get(deviceName)
        if (device) {
            device.sendMessage(message)
        } else {
            this.addLog(`Cannot send Message to device ${deviceName}`, "error")
        }
    }

}

class LINK {
    constructor(serverContext, outputDeviceObject, inputDeviceObject, outputDevice, inputDevice, isPersistent) {
        if (!(outputDeviceObject && inputDeviceObject)) {
            this.serverContext.addLog(`Link Warning. Devices Null. OutputDevice: ${outputDeviceObject} InputDevice: ${inputDeviceObject}`, "warning")
        }
        this.outputDeviceObject = outputDeviceObject;
        this.inputDeviceObject  = inputDeviceObject;
        this.outputDevice       = outputDevice
        this.inputDevice        = inputDevice
        this.serverContext      = serverContext;
        this.isPersistent       = isPersistent;
        this.lastMessage        = null;
        this.name = `${outputDevice.name}-${outputDeviceObject.name}=>${inputDevice.name}-${inputDeviceObject.name}`;
        this.displayName = `${outputDeviceObject.name}=>${inputDeviceObject.name}`

    }

    activate() {

        let outputListener = this.outputDeviceObject.getMessageEventListener();
        let inputListener  = this.inputDeviceObject.getMessageEventListener();

        if (!(outputListener && inputListener)) {
            throw new Error(`Link Failure. Listeners Error. Output: ${this.outputListener} Input: ${this.inputL}`)
        }

        if (!this.serverContext.activeLinks.has(this.name)) {
            this.serverContext.activeLinks.set(this.name, this)
        } else {
            this.serverContext.addLog(`Link Activation Failure: Link Exists. Name: ${this.name}`, "error")
            return false
        }


        outputListener.on("change", (value) => {
            this.lastMessage = value;
            this.inputDeviceObject.setIOEventListenerVariable(value);
        })

        this.outputDeviceObject.setAvailability(false)
        this.inputDeviceObject.setAvailability(false)


        this.serverContext.addLog(`Link: ${this.name}: Activated`, 'info')
    }

    deactivate() {
        let outputListener = this.outputDeviceObject.getMessageEventListener();
        outputListener.removeAllListeners("change");
        if (!this.serverContext.activeLinks.deleteItem(this.name)) {
            throw new Error("Deactivation Error. Link potentially doesn't exist.")
        }

        this.outputDeviceObject.setAvailability(true)
        this.inputDeviceObject.setAvailability(true)


        this.serverContext.addLog(`Link: ${this.name}: Deactivated`, "info")
    }

    getLastMessage() {
        return this.lastMessage
    }

}

class DEVICE {
    constructor(ws, serverContext, name, inputNames, outputNames, deviceInfo, widgets, isnode) {
        this.deviceInfo = deviceInfo;
        this.inputNames  = new Map(inputNames.map((value, index) => [value, value]));
        this.outputNames = new Map(outputNames.map((value, index) => [value, value]));
        this.widgets     = new Map()
        if (widgets) {this.widgets     = new Map(Object.entries(widgets))}
        this.inputs  = this.create_IO_objects(inputNames, true);
        this.outputs = this.create_IO_objects(outputNames, false);
        this.validStatuses = ["offline", "online", "alert", "fault", "criticalFault"];
        this.statusState = "online";
        this.pingInterval;
        this.server = serverContext;
        this.deviceLogs = [];
        this.name = name;
        this.ws = ws;
        this.isnode = isnode;
        this.nodePosition = {x: null, y: null}
        this.deviceContext = this;
        this.handleWSCloseAndError()
        this.main()


    }

    create_IO_objects(ioArray, isInput) {
        let ioMap = new Map(); 
        ioArray.forEach(ioName => {
            let ioObject = new IO(ioName, this, isInput);
            ioMap.set(ioName, ioObject)
        });
        return ioMap
    }

    addLog(logs, logType) {
        this.deviceLogs.push({"name": this.name, "log": logs, "time": new Date().toISOString(), "logType": logType})
        this.server.deviceLogs.set(this.name, this.deviceLogs)
    }

    getLogs() {
        return this.deviceLogs
    }

    setPosition(newPosition) {
        this.nodePosition = newPosition
    }

    getPosition() {
        return this.nodePosition
    }


    main() {
        this.ws.on('message', (msg) => {
            msg = JSON.parse(msg);
            switch (msg.type) {
                case "registerIO":
                    this.inputs  = this.create_IO_objects(msg.inputs, true)
                    this.outputs = this.create_IO_objects(msg.outputs, false)
                    break

                case "sendOutputs":
                    Object.entries(msg.outputs).forEach(([key, value]) => {
                        let outputName = key;
                        if (this.outputNames.has(outputName)) {
                            let inputEventListener = this.outputs.get(outputName)
                            inputEventListener.setIOEventListenerVariable(value)
                        } else {
                            this.server.addLog(`Input ${outputName} not found in device ${this.name}'s outputs: ${JSON.stringify(Array.from(this.outputNames.values()))}`, "error");
                        }
                    });
                    break;

                case "sendLogs":
                    this.addLog(msg.logs, msg.logType);
                    break;
                    
                case "modifyLogFilters":
                    this.server.modifyFilters(msg.filters)
                    break;

                case "getDeviceLogs":
                    this.sendMessage(JSON.stringify({
                        'type': "getLogs",
                        'deviceLogs': this.server.getDeviceLogs(msg.filters),
                        }
                    ))
                    break

                case "sendNodePositions":
                    this.server.saveNodePositions(msg.nodePositions)
                    break;


                case "createVirtualDevice":
                  this.server.createVirtualDevice(msg.name,msg.inputs, msg.outputs)
                  break;
                    
                case "requestIO":
                    this.sendMessage(JSON.stringify(
                        this.server.getDeviceIO()
                    ))
                    break;

                case "requestLink":
                    this.server.requestLink(msg.outputDeviceName, msg.outputName, msg.inputDeviceName, msg.inputName, false);
                    break;

                case "requestPersistentLink":
                    this.server.addPersistentLink(msg.outputDeviceName, msg.outputName, msg.inputDeviceName, msg.inputName)
                    // this.server.requestLink(msg.outputDeviceName, msg.outputName, msg.inputDeviceName, msg.inputName, true);
                    break;

                case "requestNodeLink":
                    this.server.addPersistentLink(msg.srcDevice, msg.srcIOname, msg.trgDevice, msg.trgIOname)
                    break;

                case "breakPersistentLink":
                    this.server.breakPersistentLink(msg.outputDeviceName, msg.outputName, msg.inputDeviceName, msg.inputName)
                    break;

                case "removeDeviceByName":
                    this.server.removeDeviceByName(msg.deviceName)

                case "requestLinkDataInspect":
                    let lastMessage = this.server.requestLinkDataInspection(msg.linkName);
                    if (lastMessage) {
                        this.sendMessage(JSON.stringify({
                            type:     "linkInspectData",
                            linkName: msg.linkName,
                            data:     lastMessage
                        }))
                    }
                    break;

                case "breakLink_By_LinkName":
                    this.server.breakLinkByName(msg.linkName)
                    break;

                case "requestAvailableIO":
                    let availableIO = this.server.getAvailableIO()
                    this.sendMessage(JSON.stringify({
                        type: "availableIO",
                        availableIO: availableIO
                    }))
                    break;

                case "changeStatus":
                    if (this.validStatuses.includes(msg.statusState)) {
                        this.statusState = msg.statusState;
                    } else {
                        this.server.addLog(`Invalid Status ${msg.statusState}} from Device ${this.name}`, "error")
                    }
                    break;

                case "requestEditIO":
                    this.server.sendMessageToDevice(msg.device, JSON.stringify({
                        type: "updateIO",
                        ioName: msg.ioName,
                        editIOData: msg.editIOData,
                    }))

            }
        })
        this.pingInterval = setInterval(() => {
            if (this.ws.readyState === 1) {
                this.ws.ping('.', false);
            } 
        }, 1000);
    }
    
    deactivate() {
        this.server.deviceLogs.deleteItem(this.name)
        this.inputs.forEach((input) => {
            input.deactivate()
        });
        this.outputs.forEach((outputs) => {
            outputs.deactivate()
        });
    }
    
    handleWSCloseAndError() {
        this.ws.on("error", (err) => {
            clearInterval(this.pingInterval)
            this.deactivate()
            this.server.removeDeviceByName(this.name)
        })

        this.ws.on("close", (event) => {
            clearInterval(this.pingInterval)
            this.deactivate()
            this.server.removeDeviceByName(this.name)

        })
    }

    getAvailableIO() {
        let availableIO = {
            inputs:        [],
            outputs:       [],
            all_inputs:    [],
            all_outputs:   [],
            widgets:       {},
            nodePosition:  this.nodePosition,
            isNode:        this.isnode,
            statusState:   this.statusState,
        }

        this.inputs.forEach((input, inputName) => {
            availableIO.all_inputs.push(inputName)
            if (input.isAvailable) {
                availableIO.inputs.push(inputName)
            }
        })

        this.outputs.forEach((output, outputName) => {
            availableIO.all_outputs.push(outputName)
            if (output.isAvailable) {
                availableIO.outputs.push(outputName)
            }
        })
        
        this.widgets.forEach((widget, widgetName) => {
            availableIO.widgets[widgetName] = widget
            // availableIO.widgets.push(widget)
        })

        return availableIO

    }

    sendMessage(message) {
        this.ws.send(message)
    }
    
}

class VIRTUALDEVICE {
    constructor(serverContext, name, inputs, outputs, deviceInfo) {
        this.socket        = new WebSocket('ws://localhost:8080');
        this.serverContext = serverContext
        this.name          = name
        this.inputs        = inputs
        this.outputs       = outputs
        this.inputName     = Object.keys(inputs);
        this.outputNames   = Object.keys(outputs);
        this.deviceInfo    = deviceInfo;
        this.localContext  = this;
        this.intervalArray = new Map();
        this.serverLogs    = []
        this.main()
    }

    RandomNumber(localContext, args) {
        const { sendInterval, maxValue, minValue } = args;

        const range = maxValue - minValue + 1;
        let randomNumber;
        let interval = setInterval(() => {
            randomNumber = Math.floor(Math.random() * range) + minValue;
            localContext.socket.send(JSON.stringify({
              type: "sendOutputs",
              outputs: {
                "RandomNumber": randomNumber
              },    
            }))
          }, sendInterval);
        
          localContext.intervalArray.set("RandomNumber", interval);
        
        return randomNumber;
    }

    OutputText(localContext, args) {
        const { text, sendInterval } = args;

        if (sendInterval === 0) {
            localContext.socket.send(JSON.stringify({
                type: "sendOutputs",
                outputs: {
                  "OutputText": text
                },    
            }))
        } else {
            let interval = setInterval(() => {
                localContext.socket.send(JSON.stringify({
                    type: "sendOutputs",
                    outputs: {
                      "OutputText": text
                    },    
                }))
            }, sendInterval)
              localContext.intervalArray.set("OutputText", interval);

        }
      
    }

    createRGBCreator(localContext, args) {
        const {maxPixelBrightness, sendInterval, color, noPixels, rgbFormat} = args;


        function generatePixels(maxPixelBrightness, color, noPixels, rgbFormat) {
            if (rgbFormat === "rgb_2D") {
                // RGB format: [[r, g, b], [r, g, b], ...]
                const pixels = Array.from({ length: noPixels }, () => [...color]);
                if (color.every(value => value === -1)) {
                    return pixels.map(pixel => pixel.map(channel => Math.floor(Math.random() * maxPixelBrightness)));
                } else {
                    return pixels.map(pixel => pixel.map(channel => Math.min(channel, maxPixelBrightness)));
                }
            } else if (rgbFormat === "rgb_1D"){
                // Concatenated format: [r, g, b, r, g, b, ...]
                if (color.every(value => value === -1)) {
                    const pixels = Array.from({ length: noPixels }, () => {
                        const pixelValues = [Math.floor(Math.random() * maxPixelBrightness), Math.floor(Math.random() * maxPixelBrightness), Math.floor(Math.random() * maxPixelBrightness)];
                        return pixelValues;
                      }).flat();
                    return pixels;
        
                } else {
                    const pixelValues = color.map(channel => Math.min(channel, maxPixelBrightness));
                    return Array.from({ length: noPixels }, () => pixelValues).flat();
                }
            }
          }

        if (sendInterval === 0) {
            localContext.socket.send(JSON.stringify({
                type: "sendOutputs",
                outputs: {
                  "RGBCreator": generatePixels(maxPixelBrightness, color, noPixels, rgbFormat)
                },    
            }))

        } else {
            let interval = setInterval(() => {
                localContext.socket.send(JSON.stringify({
                    type: "sendOutputs",
                    outputs: {
                      "RGBCreator": generatePixels(maxPixelBrightness, color, noPixels, rgbFormat)
                    },    
                }))

            }, sendInterval)
            
            localContext.intervalArray.set("RGBCreator", interval);
        }
    }

    main() {
        this.socket.addEventListener('open', () => {
            setTimeout(() => {
                this.socket.send(JSON.stringify({
                    type:        "registerDevice",
                    name:        this.name,
                    inputNames:  this.inputName,
                    outputNames: this.outputNames,
                    deviceInfo:  this.deviceInfo,
                }))
            }, 500);

            setTimeout(() => {
                const outputFunctionList = {
                    'RandomNumber': this.RandomNumber,
                    'OutputText':   this.OutputText,
                    'RGBCreator':   this.createRGBCreator,
                }
        
                for (const key in this.outputs) {
                    if (outputFunctionList.hasOwnProperty(key)) {
                      const args = this.outputs[key].info;
                      outputFunctionList[key](this.localContext, args);
                    }
                }
            }, 2000)

        })

        
        let checkerInterval = setInterval(() => {
            // very poor, need to be fixed in the futurre by doing this server-class
            if (!this.serverContext.connectedDevices.has(this.name)) {
                 this.localContext.intervalArray.forEach((interval) => {
                    clearInterval(interval)
                })
                this.serverContext.addLog(`DEVICE: Virtual ${this.name} deactivated intervals`, 'info')
                clearInterval(checkerInterval)
            }
        }, 5000)

    }
}

class IO {
    constructor(name, device, isInput) {
        this.name = name;
        this.device = device;
        this.deviceName = device.name
        this.isInput = isInput;
        this.isAvailable = true;
        this.eventListener = new VariableWatcher(false)
        if (this.isInput) {
            this.sendInputToDevice()
        }
    }

    setAvailability(isAvailable) {
        this.isAvailable = isAvailable;
    }

    sendInputToDevice() {
        this.eventListener.on("change", (value) => {
            let msg = JSON.stringify({
                type: "sendInputs",
                inputs: {
                    [this.name] : value
                }
            })
            this.sendMessage(msg)
        })
    }

    deactivate() {
        this.eventListener.removeAllListeners("change");
    }

    setIOEventListenerVariable(value) {
        this.eventListener.setVariable(value)
    }

    sendMessage(msg) {
        this.device.sendMessage(msg) //funnybusnes
    }

    getMessageEventListener() {
        return this.eventListener
    }
}
const server = new SERVER(8080, "webClient", "savedData.json")
server.loadLinks()

