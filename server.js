const WebSocket               = require('ws');
const EventEmitter            = require('events');
const { PassThrough }         = require('stream');
const { error, Console, log } = require('console');
const fs                      = require('fs');
const { setTimeout }          = require('timers');


function isDict(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

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

class ObservableMap {
    constructor(runOnUpdate) {
        this.map             = new Map();
        this.runOnUpdate     = runOnUpdate;
        this.set             = this.set.bind(this);
        this.get             = this.get.bind(this);
        this.deleteItem      = this.deleteItem.bind(this);
        this.has             = this.has.bind(this);
        this.forEach         = this.forEach.bind(this);
        this.getMap          = this.getMap.bind(this);
        this.getMapFunctions = this.getMapFunctions.bind(this);
    }
  
    set = (key, value) => {
        this.map.set(key, value);
        this.runOnUpdate()
      return this.map;
    };
  
    get = function (key) {
        return this.map.get(key);
    };
  
    deleteItem = function (key) {
        let item = this.map.delete(key)
        this.runOnUpdate()
        return item;
    };
  
    has = function (key) {
      return this.map.has(key);
    };
  
    forEach = function (callback) {
      this.map.forEach(callback);
    };

    getMap() {
        return this.map
    }

    getMapFunctions() {
        return {
            "set":        this.set,
            "get":        this.get,
            "deleteItem": this.deleteItem,
            "has":        this.has,
            "forEach":    this.forEach,
            "map":        this.map,
            "getMap":     this.getMap,
          };
    }

}

class SERVER {
    constructor(port, reactClientName, savedLinkFiles) {
        this.server      = new WebSocket.Server({ port: port, pingInterval: 5000,   pingTimeout: 1000 });
        this.activeLinks = new ObservableMap(this.on_activeLinks_Change.bind(this)).getMapFunctions()
        this.reactClientName  = reactClientName;
        this.savedLinkFiles   = savedLinkFiles;
        this.connectedDevices = new Map();
        this.persistentLinks  = new ObservableMap(this.on_PersistentLinks_Update.bind(this)).getMapFunctions();
        this.sendReactUpdate  = true;
        this.serverLogVirtDevice;
        this.maxLogCount = {
            "info":    50,
            "error":   50,
            "warning": 50,
            "success": 50,
        }
        this.logFilters = {selectedDevices: [], time: {"from": new Date("2000-01-01"),  "to": new Date()},
                           alerts: ["warning", "error", "info", "success"],     search: ""};
        this.serverContext = this;
        this.printLogs     = true;
        this.sendUpdate    = true;
        this.pingTimeout   = 1500;
        this.messagesPerSecond = 5; 
        this.rateLimits = {};
        this.loadLinks()
        this.main()

    }

    main() {
        this.serverLogVirtDevice = this.createVirtualDevice("Server", {}, {}, false)

        this.server.on('connection', (socket, req) => {
            this.addLog("Server", "Device: Device connected.", "info")
            let ip = req.socket.remoteAddress
            socket.on('message', (msg) => {
                msg = JSON.parse(msg)
                if (msg.type === "registerDevice") {
                    this.addLog("Server",  `Device: ${msg.name} registered. Ip: ${ip}`, "info")

                    if (this.connectedDevices.has(msg.name)) { 
                        let newName = msg.name;
                        if (msg.name.includes(this.reactClientName)) {
                            let i = 0;
                            while (this.connectedDevices.has(newName)) {
                                newName = `${msg.name}-${i}`;
                                i++;
                            }
                    
                            socket.send(JSON.stringify({
                                type: "nameTaken",
                                proposedName: newName,
                            }));
                    
                        } else {
                            socket.send(JSON.stringify({
                                type: "nameTaken"
                            }));
                        }
                    
                        setTimeout(() => {
                            socket.close();
                        }, 100);
                    }else {
                        let device = new DEVICE(socket, this.serverContext, msg.name, msg.inputNames,
                                                msg.outputNames, msg.deviceInfo, msg.widgets, msg.isNode,
                                                msg.supportedEncryptionStandards)
                        
                        device.sendMessage(JSON.stringify({
                            type: "connected"
                        }))
                        
                        if (device.name.includes(this.reactClientName)) {
                            device.sendMessage(
                                JSON.stringify({
                                    type: "linkMapUpdate",
                                    activeLinks:      this.getActiveLinkInfo(),
                                })
                            );
                            device.sendMessage(
                                JSON.stringify({
                                    type: "getLogs",
                                    deviceLogs:       this.getDeviceLogs(true),
                                })
                            );
                            device.sendMessage(
                                JSON.stringify({
                                    type: "persistentLinksUpdate",
                                    persistentLinks:  this.getPersistentLinks(),
                                })
                            );

                            device.sendMessage(JSON.stringify({
                                type: "availableIO",
                                availableIO: this.getAvailableIO(),
                            }))


                        }
                        this.connectedDevices.set(device.name, device)
                        this.checkForPersistentLink();
                        this.checkDeviceSavedData()
                    }
                }
            })
        })
    }

    on_PersistentLinks_Update() {
        if (this.sendReactUpdate) {
            this.connectedDevices.forEach((device) => {
                if (device.name.includes(this.reactClientName)) {
                    device.sendMessage(
                        JSON.stringify({
                            type: "persistentLinksUpdate",
                            persistentLinks: this.getPersistentLinks(),
                        })
                    );
                }
            });
        }
    }

    on_activeLinks_Change() {
        if (this.sendReactUpdate) {
            this.connectedDevices.forEach((device) => {
                if (device.name.includes(this.reactClientName)) {
                    device.sendMessage(
                        JSON.stringify({
                            type: "linkMapUpdate",
                            activeLinks: this.getActiveLinkInfo(),
                        })
                    );
                }
            });
        }
    }

    addLog(deviceName, log, logType) {
        if (this.printLogs && deviceName === "Server") {
            console.log(log);
        }

        if (!this.connectedDevices.has(deviceName)) {
            console.log(`Failure to add log. Device ${deviceName} doesn't exist.`);
            return null;
        }

        if (deviceName.includes("webClient")) {
            return null;
        }

        const now = Date.now();
        if (!this.rateLimits[deviceName]) {
            this.rateLimits[deviceName] = [];
        }

        // Remove logs older than one second
        this.rateLimits[deviceName] = this.rateLimits[deviceName].filter(timestamp => now - timestamp < 1000);

        if (this.rateLimits[deviceName].length >= this.messagesPerSecond) {
            console.log(`Rate limit exceeded for device ${deviceName}`);
            // if (deviceName !== "Server") {
                // server.removeDeviceByName(deviceName)
            // }
            return null;
        }

        this.rateLimits[deviceName].push(now);

        let logData = {
            name: deviceName,
            log: log,
            time: new Date().toISOString(),
            logType: logType
        };

        try {
            let parsedData = this.validateDataStructure(this.savedLinkFiles, true);
            if (!parsedData.deviceData[deviceName]) {
                parsedData.deviceData[deviceName] = {
                    logs: [],
                    position: { x: 0, y: 0 }
                };
            }

            parsedData.deviceData[deviceName].logs.push(logData);

            let currentDeviceLogs = parsedData.deviceData[deviceName].logs;
            let maxSize = this.maxLogCount[logType];
            let logs_not_logType = currentDeviceLogs.filter(log => log.hasOwnProperty('logType') && log.logType !== logType);
            let logs_ARE_logType = currentDeviceLogs.filter(log => log.logType === logType);
            let logs_ARE_logType_RESIZED = logs_ARE_logType.slice(-maxSize);

            let deviceLogsToAdd = [...logs_not_logType, ...logs_ARE_logType_RESIZED];

            parsedData.deviceData[deviceName].logs = deviceLogsToAdd;
            fs.writeFileSync(this.savedLinkFiles, JSON.stringify(parsedData, null, 2), 'utf-8');
        } catch (error) {
            console.log('Error parsing existing file content:' + error.stack);
        }

        if (this.sendReactUpdate) {
            this.connectedDevices.forEach(device => {
                if (device.name.includes(this.reactClientName)) {
                    device.sendMessage(
                        JSON.stringify({
                            type: "getLogs",
                            deviceLogs: this.getDeviceLogs(true),
                        })
                    );
                }
            });
        }
    }

    on_deviceLogs_Change() {
        if (this.sendReactUpdate) {
            this.connectedDevices.forEach((device) => {
                if (device.name.includes(this.reactClientName)) {
                    device.sendMessage(
                        JSON.stringify({
                            type: "getLogs",
                            deviceLogs: this.getDeviceLogs(true),
                          })
                    );
                }
            });
        }

        try {
            const excludedLogTypes  = [""] 
            let fileData = fs.readFileSync(this.savedLinkFiles, 'utf-8');
            let parsedData = JSON.parse(fileData);
            if (!parsedData.hasOwnProperty('deviceData')) {
                parsedData["deviceData"] = {}
            }
            let deviceData = parsedData.deviceData
            this.connectedDevices.forEach((device, deviceName) => {
                if (!Object.keys(deviceData).includes(deviceName)) {
                    deviceData[deviceName] = {"logs": []}
                }
                if (deviceData[deviceName].hasOwnProperty("logs") && deviceData[deviceName].logs.length > 0) {
                }
            })

            fs.writeFileSync(this.savedLinkFiles, JSON.stringify(parsedData, null, 2), 'utf-8');
        } catch (error) {
            console.log('Error parsing existing file content:' + error );
            throw error
        }

        
        
    }

    validateDataStructure(fileName, saveChanges) {
        if (!fs.existsSync(fileName)) { 
            fs.writeFileSync(fileName, '', 'utf-8');
        }

        let fileData = fs.readFileSync(fileName, 'utf-8');

        if (fileData.trim() === '') { 
            return {
                "links": [], 
                "deviceData": {},
            }; 
        } else {
            let parsedData = JSON.parse(fileData)
            if (!parsedData.hasOwnProperty('links')) {
                parsedData['links'] = []
            }

            if (!parsedData.hasOwnProperty('deviceData')) {
                parsedData['deviceData'] = {}
            }  


            let deviceData = parsedData['deviceData']

            if (Object.keys(deviceData).length > 0) { 
                Object.keys(deviceData).forEach((deviceName) => {
                    let device = deviceData[deviceName]
                    if (!device.hasOwnProperty('logs')) {
                        device['logs'] = []
                    }

                    if (!device.hasOwnProperty('position')) {
                        device['position'] = {x: 0, y: 0}
                    }
                })
            }

            if (saveChanges) {fs.writeFileSync(fileName, JSON.stringify(parsedData, null, 2), 'utf-8');}

            return parsedData
        }


    }
    
    modifyFilters(filters) {
        for (const key of Object.keys(filters)) {
            if (true) {
                this.logFilters[key] = filters[key]
            } 
        }

        this.on_deviceLogs_Change()
    }

    saveNodePositions(nodePositions) {
        try {
            let fileData = fs.readFileSync(this.savedLinkFiles, 'utf-8');
            let parsedData =  this.validateDataStructure(this.savedLinkFiles, true);
            
            if (typeof parsedData.deviceData === 'undefined') {
                parsedData["deviceData"] = {}
            }

            let deviceData = parsedData.deviceData

            nodePositions.forEach((nodeData) => {
                let device = this.connectedDevices.get(nodeData.name)
                if (device) {
                    deviceData[nodeData.name] = {...deviceData[nodeData.name], "position": nodeData.position}
                    device.setPosition(nodeData.position)
                }
            })
            fs.writeFileSync(this.savedLinkFiles, JSON.stringify(parsedData, null, 2), 'utf-8');
        } catch (error) {
            this.addLog("Server",  'Error parsing existing file content:'  + error, "error");
        }

    }

    checkDeviceSavedData() {
        try {
            const fileData = fs.readFileSync(this.savedLinkFiles, 'utf-8');
            let parsedData;
            if (fileData.trim() === '') {
                parsedData = {
                    "links": [], 
                    "deviceData": {},
                }; 
                
                fs.writeFileSync(this.savedLinkFiles, JSON.stringify(parsedData, null, 2), 'utf-8');
            } else {
                parsedData = JSON.parse(fileData)
            }

            if (parsedData["deviceData"]) {
                Object.keys(parsedData["deviceData"]).forEach((deviceName) => {
                    let device = this.connectedDevices.get(deviceName)
                    if (device) {
                        device.setPosition(parsedData["deviceData"][deviceName]["position"])
                    }
                });
            }
        } catch (error) {
        this.addLog("Server", 'Error reading JSON file:'+ error.message, "error");
        }
    }

    loadLinks() {
        try {
            const fileData = fs.readFileSync(this.savedLinkFiles, 'utf-8');
            const parsedData = JSON.parse(fileData);
            if (parsedData["links"]) {
                parsedData["links"].forEach((link) => {
                    this.addPersistentLink(link.outputDeviceName, link.outputName, link.inputDeviceName, link.inputName, 
                                            link.encrypt_algorithm, link.key_size, link.highest_compatible, link.isHybrid)
                });
            }
          } catch (error) {
            console.error('Error reading JSON file:', error.message);
          }
    }

    createVirtualDevice(name,inputs, outputs, isNode) {
        return new VIRTUALDEVICE(this.serverContext, name, inputs, outputs, "VirtualDevice", isNode)

    }

    requestLinkDataInspection(linkName) {
        let link = this.activeLinks.get(linkName)
        if (link) { 
            return link.getLastMessage()
        } else {
            this.addLog("Server", `Link ${linkName} doesn't exist.`, "error")
        }

    }

    getDeviceIO() {
        let deviceInfo = {};

        for (const [name, device] of this.connectedDevices.entries()) {
            deviceInfo[name] = {
                name:        device.name,
                inputs:      device.inputs,
                outputs:     device.outputs,

            }
        }

        return {
            devices: deviceInfo
        }
    }

    getIOObject(deviceName, IOname, isInput) {
        const device = this.connectedDevices.get(deviceName);
        if (!device) {
            return false
        }
    
        if (isInput) {
            const input = device.inputs.get(IOname);
            if (!input) {
                this.addLog("Server", `Device ${deviceName} doesn't have input: ${IOname}`, "error");
                return false;
            }
            return input;
        } else {
            const output = device.outputs.get(IOname);
            if (!output) {
                this.addLog("Server", `Device ${deviceName} doesn't have output: ${IOname}`, "error");
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
    
    getPersistentLinks() {
        let persistentLinksData = {};
        this.persistentLinks.forEach((linkData, linkName) => {
            persistentLinksData[linkName] = linkData
        })
        return persistentLinksData
    }

    getLogsByDevice() {
        let allDeviceLogs = {};

        this.connectedDevices.forEach((device, deviceName) => {
            allDeviceLogs[deviceName] = device.getLogs()

            for (let log of localLog) {
                allDeviceLogs.push(log)
            }
        })
    }
    
    getDeviceLogs() {
        let deviceLogs = [];
        let logFilters = this.logFilters;

        let to   = new Date(logFilters.time.to)
        let from = new Date(logFilters.time.from)

        to.setHours(23, 59, 59, 999);
        from.setHours(23, 59, 59, 999);

        let allDeviceLogs = {}
        

        try {
            const fileData   = fs.readFileSync(this.savedLinkFiles, 'utf-8');
            const parsedData = JSON.parse(fileData);
            if (parsedData.hasOwnProperty("deviceData")) {
                Object.keys(parsedData["deviceData"]).forEach((name) => {
                    allDeviceLogs[name] = parsedData["deviceData"][name].logs
                });
            }
          } catch (error) {
            console.error('Error reading JSON file:', error.message);
          }
        
        Object.keys(allDeviceLogs).forEach((name) => {
            let localLog = allDeviceLogs[name]
            if (localLog) {
                for (let log of localLog) {
                    if (logFilters.selectedDevices.includes(name)) {
                        if (logFilters.alerts.includes(log.logType)) {
                            let logTime = new Date(log.time)
                            if (logTime >= from && logTime <= to) {
                                if (logFilters.search === "") {
                                    deviceLogs.push(log)
                                }  else if (JSON.stringify(log).toLocaleLowerCase().includes(logFilters.search.toLocaleLowerCase())) {
                                    deviceLogs.push(log)
                                }
                            }
                        }
                    }
                }
            }
        })

        deviceLogs.sort((logA, logB) => new Date(logA.time) - new Date(logB.time));

        deviceLogs = deviceLogs.slice(-200)

        return deviceLogs
    }

    communicate_Encryption_Protocols(outputDevice, inputDevice, algorithm, highest_compatible, outputName, inputName, keySize, isHybrid) {
        console.log("Attempting Encryption")
        if (this.check_Common_Encryption_Algo(outputDevice, inputDevice, algorithm, isHybrid)) { 
            if (highest_compatible) { 
                keySize = this.get_Highest_Common_Key(outputDevice, inputDevice, algorithm)
            }
            
            if (this.is_Key_Common(outputDevice, inputDevice, algorithm, keySize)) {
                this.keyExchange(algorithm, keySize, outputDevice, outputName, inputDevice, inputName, isHybrid)
                return true
            } else {
                console.log(`Uncommon Key proposed. requestLink() ${algorithm} ${keySize}`)
            }

        } else {
            console.log(`No common Encryption algorithm. Denying Link Request. requestLink()`)
        }
        return false
    }
    
    check_Common_Encryption_Algo(outputDevice, inputDevice, algo) {
        let output_Algos = Object.keys(outputDevice.supportedEncryptionStandards)
        let input_Algos  = Object.keys(inputDevice.supportedEncryptionStandards)
        if (output_Algos.includes(algo) && input_Algos.includes(algo)) {
            return true
        }
        return false
    }

    get_Highest_Common_Key(outputDevice, inputDevice, algo) {
        const output_Algo = outputDevice.supportedEncryptionStandards[algo];
        const input_Algo = inputDevice.supportedEncryptionStandards[algo];
      
        if (output_Algo && input_Algo) {
            if (output_Algo.hasOwnProperty("keys") && output_Algo.hasOwnProperty("keys")) {
                const outputKeySizes = Object.keys(output_Algo.keys);
                const inputKeySizes = Object.keys(input_Algo.keys);
            
                const setOutputKeySizes = new Set(outputKeySizes);
                const setInputKeySizes = new Set(inputKeySizes);
            
                const commonKeySizes = [...setOutputKeySizes].filter(size =>
                  setInputKeySizes.has(size)
                );
      
                if (commonKeySizes.length > 0) {
                  return Math.max(...commonKeySizes);
                } else {
                  return null; 
                }
            } else {
                console.log("Encryption Error. No property Keys.")
            }
        } else {
          return null; 
        }
      }

    is_Key_Common(outputDevice, inputDevice, algorithm,  keySize) {
        keySize = keySize.toString()
        let output_Algo = (outputDevice.supportedEncryptionStandards)[algorithm]
        let input_Algo  = (inputDevice.supportedEncryptionStandards)[algorithm]
        const outputKeySizes = Object.keys(output_Algo.keys)
        const inputKeySizes  = Object.keys(input_Algo.keys)

        return outputKeySizes.includes(keySize) && inputKeySizes.includes(keySize)
    }

    keyExchange(algorithm, key_Size, outputDevice, outputName, inputDevice, inputName, isHybrid) {
        const outputPublicKey = outputDevice.getPublicKey(algorithm, key_Size)
        const inputPublicKey  = inputDevice.getPublicKey(algorithm, key_Size)
        outputDevice.sendPublicKey(algorithm, key_Size,  outputName, inputPublicKey, true, isHybrid)
        inputDevice.sendPublicKey(algorithm,  key_Size,   inputName, outputPublicKey, false, isHybrid)
    }


    requestLink(outputDeviceName, outputName, inputDeviceName, inputName, isPersistent, algorithm = null, keySize = null, highest_compatible = null, isHybrid = null) {
        let outputIOObject = this.getIOObject(outputDeviceName, outputName, false);
        let inputIOObject  = this.getIOObject(inputDeviceName,  inputName,  true );
        let outputDevice   = this.getDevice(outputDeviceName);
        let inputDevice    = this.getDevice(inputDeviceName);

        if (!(outputIOObject && inputIOObject && outputDevice && inputDevice)) { 
            this.addLog("Server", `Null parameters at requestLink(): outputDeviceName: ${outputDeviceName}    outputName: ${outputName}    inputDeviceName: ${inputDeviceName}    inputName: ${inputName}`)
            return false
        }

        if (algorithm && keySize || algorithm && highest_compatible) {
            if (!this.communicate_Encryption_Protocols(outputDevice, inputDevice, algorithm, highest_compatible, outputName, inputName, keySize, isHybrid)) {
                console.log("Encryption Failed.")
                return false
            }
        }

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
                                "linkName":             proposedLinkName,
                                "outputDeviceName":     outputDevice.name,
                                "outputName":           outputIOObject.name,
                                "inputDeviceName":      inputDevice.name,
                                "inputName":            inputIOObject.name,
                                "encrypt_algorithm" :   algorithm,
                                "key_size" :            keySize ,
                                "highest_compatible" :  highest_compatible,
                                "isHybrid":             isHybrid,
                            };
                            linkData.push(newLink);
                            fs.writeFileSync(this.savedLinkFiles, JSON.stringify(fileData, null, 2), 'utf-8');
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
            this.addLog("Server", `Error on outputDeviceName: ${outputDeviceName}    outputName: ${outputName}    inputDeviceName: ${inputDeviceName}    inputName: ${inputName}
            ${error}`, "error")
            return false
          } 
    }

    addPersistentLink(outputDeviceName, outputName, inputDeviceName, inputName, encrypt_algorithm, key_size, highest_compatible, isHybrid) {
        let linkName = `${outputDeviceName}-${outputName}=>${inputDeviceName}-${inputName}`;
        let linkData = {
            "outputDeviceName":    outputDeviceName,
            "outputName":          outputName,
            "inputDeviceName":     inputDeviceName,
            "inputName":           inputName,
            "encrypt_algorithm":   encrypt_algorithm,
            "key_size":            key_size,
            "highest_compatible":  highest_compatible,
            "isHybrid":            isHybrid,
        };
    
        this.persistentLinks.set(linkName, linkData);
        this.addLog("Server", `Persistent Link: ${linkName}: Activating `, "info");
        this.checkForPersistentLink();
    }

    breakPersistentLink(outputDeviceName, outputName, inputDeviceName, inputName, linkName = null) {
        if (!linkName) {
            linkName = `${outputDeviceName}-${outputName}=>${inputDeviceName}-${inputName}`
        } 

        if (this.persistentLinks.deleteItem(linkName)) {
            this.addLog("Server", `Persistent Link: ${linkName}:  Broken and Deactivating: `, "info")
            this.breakLinkWithIONames(outputDeviceName, outputName, inputDeviceName, inputName)
            let fileData = fs.readFileSync(this.savedLinkFiles, 'utf-8');
            try {
                let parsedData =  this.validateDataStructure(this.savedLinkFiles, true);
                let linksToSave = parsedData.links.filter(link => link.linkName !== linkName);
                parsedData.links = linksToSave
                
                fs.writeFileSync(this.savedLinkFiles, JSON.stringify(parsedData, null, 2), 'utf-8');
            } catch (error) {
                console.error('Error parsing existing file content:', error);
            }
            return true
        } else {
            this.addLog("Server", `Persistent Link: ${linkName}: ERROR Not Found: `, "error")
        }
        return false
    }

    updatePersistentLink(linkName, outputDeviceName, outputName, inputDeviceName, inputName, encrypt_algorithm, key_size, highest_compatible, isHybrid) {
        if (this.breakPersistentLink(outputDeviceName, outputName, inputDeviceName, inputName, linkName = linkName)) {
            this.addPersistentLink(outputDeviceName, outputName, inputDeviceName, inputName,  encrypt_algorithm, key_size, highest_compatible, isHybrid)
        } else {
            this.addLog("Server", `Persistent Link: ${linkName}: ERROR Failed to Update: INFO: \n
              outputDeviceName: ${outputDeviceName}, outputName: ${outputName},
              inputDeviceName: ${inputDeviceName}, inputName: ${inputName}`, "error")
        }
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
                    this.requestLink(linkData.outputDeviceName, linkData.outputName, 
                                    linkData.inputDeviceName, linkData.inputName, true, 
                                    linkData.encrypt_algorithm, linkData.key_size, linkData.highest_compatible, 
                                    linkData.isHybrid)
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
            this.addLog("Server", `Deactivation failure. Link Name ${linkName} doesn't exist.`, "error")
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
        this.addLog("Server", "Attempts to disconnect " + deviceName, "info")

        this.activeLinks.forEach((link) => {
            if (link.outputDeviceObject.device.name === deviceName || link.inputDeviceObject.device.name === deviceName) {
                this.addLog("Server", "Link deactivated due to disconnected device, device Name: " + deviceName, 'info')
                link.deactivate()
            }
        })
        let device = this.connectedDevices.get(deviceName)
        if (device) {
            this.connectedDevices.get(deviceName).deactivate()
            this.connectedDevices.get(deviceName).ws.close()
        } else {
            this.addLog("Server", "Device not found.", "error")

        }
         if (this.connectedDevices.delete(deviceName)) {
            this.addLog("Server", `Device: ${deviceName} Deleted.`, "info")
         } else {
            this.addLog("Server", "Device not deleted.", "error")
         }
    }

    sendMessageToDevice(deviceName, message) {
        let device = this.connectedDevices.get(deviceName)
        if (device) {
            device.sendMessage(message)
        } else {
            this.addLog("Server", `Cannot send Message to device ${deviceName}`, "error")
        }
    }

}

class LINK {
    constructor(serverContext, outputDeviceObject, inputDeviceObject, outputDevice, inputDevice, isPersistent) {
        if (!(outputDeviceObject && inputDeviceObject)) {
            this.serverContext.addLog("Server", `Link Warning. Devices Null. OutputDevice: ${outputDeviceObject} InputDevice: ${inputDeviceObject}`, "warning")
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
        let outputListener = this.outputDeviceObject.addListener(this.inputDeviceObject.name);

        if (!(outputListener)) {
            throw new Error(`Link Failure. Listeners Error. Output: ${this.outputListener} Input: ${this.inputL}`)
        }

        if (!this.serverContext.activeLinks.has(this.name)) { // If the list doesn't already exist.

            console.log(this.outputDeviceObject.getDataType())
            console.log(this.inputDeviceObject.getDataType())

            let inputDataType = this.inputDeviceObject.getDataType()
            let outputDataType = this.outputDeviceObject.getDataType()

            if ((inputDataType === outputDataType) || inputDataType == "typeless") {
                this.serverContext.activeLinks.set(this.name, this)
                let output_device_IO_Name  = this.outputDeviceObject.name
                let input_device_IO_Name   = this.inputDeviceObject.name
                let output_device_name     = this.outputDevice.name
                let input_device_name      = this.inputDevice.name
    
                this.outputDevice.addConnectedDevice(output_device_IO_Name, input_device_name)
                this.inputDevice.addConnectedDevice(input_device_IO_Name, output_device_name)
            } else {
                this.serverContext.addLog("Server",`Link Activation Failure: Incompatible Data Types.  ${outputDataType} => ${inputDataType} |  Link Name: ${this.name}`, "error")
                return false
            }



        } else {
            this.serverContext.addLog("Server",`Link Activation Failure: Link Exists. Name: ${this.name}`, "error")
            return false
        }


        outputListener.on("change", (value) => {
            this.lastMessage = JSON.stringify(value);
            this.inputDeviceObject.setIOEventListenerVariable(value);
        })

        this.outputDeviceObject.setAvailability(false)
        this.inputDeviceObject.setAvailability(false)


        this.serverContext.addLog("Server", `Link: ${this.name}: Activated`, 'info')
    }

    deactivate() {
        let outputListener = this.outputDeviceObject.removeListener(this.inputDeviceObject.name);
        // outputListener.removeAllListeners("change");
        
        if (!this.serverContext.activeLinks.deleteItem(this.name)) {
            throw new Error("Deactivation Error. Link potentially doesn't exist.")
        }

        let output_device_IO_Name  = this.outputDeviceObject.name
        let input_device_IO_Name   = this.inputDeviceObject.name
        let output_device_name     =  this.outputDevice.name
        let input_device_name      =  this.inputDevice.name

        this.outputDevice.removeConnectedDevice(output_device_IO_Name)
        this.inputDevice.removeConnectedDevice(input_device_IO_Name)

        this.outputDeviceObject.setAvailability(true)
        this.inputDeviceObject.setAvailability(true)

        this.serverContext.addLog("Server",`Link: ${this.name}: Deactivated`, "info")
    }


    updateEncryption(algorithm, highest_compatible, keySize) {
        if (algorithm && keySize || algorithm && highest_compatible) {
            if (!this.communicate_Encryption_Protocols(this.outputDevice, this.inputDevice, algorithm, highest_compatible, this.outputDeviceObject.name, this.inputDeviceObject.name, keySize)) {
                console.log("Update Link Encryption Failed:", "\nOutput Device:", this.outputDevice, "\nInput Device:", this.inputDevice, "\nAlgorithm:",
                            algorithm, "\nHighest Compatible:", highest_compatible, "\nOutput Device Name:", this.outputDeviceObject.name, "\nInput Device Name:",
                            this.inputDeviceObject.name, "\nKey Size:", keySize);
            }
        }
    }

    getLastMessage() {
        return this.lastMessage
    }

}

class DEVICE {
    constructor(ws, serverContext, name, inputNames, outputNames, deviceInfo, widgets, isnode, supportedEncryptionStandards) {
        this.deviceInfo = deviceInfo;
        this.supportedEncryptionStandards = supportedEncryptionStandards

        this.connectedTo = {}
        this.widgets     = new Map()
        if (widgets) {this.widgets     = widgets}
        this.validDataTypes = ['str', "int", "float", "boolean",  "array", "typeless"];
        this.inputs  = this.create_IO_objects(inputNames, true);
        this.outputs = this.create_IO_objects(outputNames, false);

        this.inputNames = new Map()
        this.outputNames = new Map()

        this.inputs.forEach((value, key) => {this.inputNames.set(value.name, value.name);});
        this.outputs.forEach((value, key) => {this.outputNames.set(value.name, value.name);});

        this.validStatuses = ["offline", "online", "alert", "fault", "criticalFault"];
        this.statusState = "online";
        this.pingInterval;
        this.server = serverContext;
        this.name = name;
        this.ws = ws;
        this.isnode = isnode;
        this.nodePosition = {x: null, y: null}
        this.deviceContext = this;
        this.handleWSCloseAndError()
        this.main()
    }


    getPublicKey(algorithm, keySize) {
        if (this.supportedEncryptionStandards.hasOwnProperty(algorithm)) {
            keySize = keySize.toString()
            let publicKey = this.supportedEncryptionStandards[algorithm].keys[keySize]
            return publicKey
        } else {
            throw new Error(`Algorithm ${algorithm} doesn't exist in ${this.name}'s algorithms. 'getPublicKey(${algorithm}, ${keySize})'`);
        }

    }

    sendPublicKey(algorithm, key_Size, ioName, publicKey, isOutput, isHybrid) {
        this.sendMessage(JSON.stringify({
            "type":     "sendPublicKey",
            "algorithm":  algorithm,
            "key_size":   key_Size,
            "publicKey":  publicKey,
            "isHybrid":   isHybrid,
            "ioName":     ioName, 
            "isOutput":   isOutput,
        }))
    }

    
    modify_widget_key_pair(widgetName, keyPair) {
        if (this.widgets) {
            let key = Object.keys(keyPair)[0]
            let value = Object.values(keyPair)[0]
            let widget = this.widgets.find(widget => widget.widgetName === widgetName)
            if (widget) {
                widget[key] = value;             
            } else {
                console.log(`Error: No Such Widget Name: Device: ${this.name} WidgetName: ${this.widgetName}`)
            }
        } else {
            console.log(`Error: No Widgets in Device: ${this.name}`)
        }
    }
    
    modify_widget(widgetName, widgets) {
        if (this.widgets) {
            if (this.widgets.includes(widgetName)) {
                this.widgets[widgetName] = widgets;
            } else {
                console.log(`Error: No Such Widget Name: Device: ${this.name} WidgetName: ${this.widgetName}`)
            }
        } else {
            console.log(`Error: No Widgets in Device: ${this.name}`)
        }
    }

    create_IO_objects(ioArray, isInput) {

        let ioMap = new Map(); 
        if (ioArray !== null && Array.isArray(ioArray)) {
            ioArray.forEach(ioName => {
                let ioObject = new IO(ioName, this, isInput);
                ioMap.set(ioName, ioObject)
            });
        } else if (isDict(ioArray)) {
            for (const [ioName, dataType] of Object.entries(ioArray)) {
                if (this.validDataTypes.includes(dataType.toLowerCase())) {
                    let ioObject = new IO(ioName, this, isInput, dataType);
                    ioMap.set(ioName, ioObject)
                } else {
                    console.log("invalid data type: " + dataType)
                }
            }
        } else {
            ioArray = []
        }
        
        return ioMap
    }

    setPosition(newPosition) {
        this.nodePosition = newPosition
    }

    getPosition() {
        return this.nodePosition
    }

    addConnectedDevice(IOName, deviceName) {
        this.connectedTo[IOName] = deviceName
    }

    removeConnectedDevice(IOName) {
        if (IOName in this.connectedTo) {
            delete this.connectedTo[IOName]
        } else {
            this.server.addLog(this.name, `IOName not deleted from connectedTo: ${IOName}`, "error");
        }
    }

    getConnectedDevices() {
        return this.connectedTo
    }

    main() {
        this.ws.on('message', (msg) => {
            msg = JSON.parse(msg);
            switch (msg.type) {
                case "registerIO": // To add/remove new inputs outputs after registration.
                    if (msg.inputs && msg.outputs) {
                        // this.inputs      = this.create_IO_objects(msg.inputs, true)
                        // this.inputNames  = new Map(msg.inputs.map(value => [value, value]))
                        // this.outputs     = this.create_IO_objects(msg.outputs, false)
                        // this.outputNames = new Map(msg.outputs.map(value => [value, value]))

                        this.inputs  = this.create_IO_objects(msg.inputs, true);
                        this.outputs = this.create_IO_objects(msg.outputs, false);
                        this.inputNames = new Map()
                        this.outputNames = new Map()
                        this.inputs.forEach((value, key) => {this.inputNames.set(value.name, value.name);});
                        this.outputs.forEach((value, key) => {this.outputNames.set(value.name, value.name);});
                
                        
                        // this.inputNames  = msg.inputs
                        this.server.checkForPersistentLink()
                    }
                    break

                case "sendOutputs":
                    if ((msg.outputs)) {
                        Object.entries(msg.outputs).forEach(([key, value]) => {
                            let outputName = key;
                            if (this.outputNames.has(outputName)) {
                                let inputEventListener = this.outputs.get(outputName)
                                inputEventListener.setIOEventListenerVariable(value)
                            } else {
                                this.server.addLog("Server", `Input ${outputName} not found in device ${this.name}'s outputs: ${JSON.stringify(Array.from(this.outputNames.values()))}`, "error");
                            }
                        });
                    }
                    break

                case "sendLogs":
                    if ((this.name && msg.logs && msg.logType)) {
                        this.server.addLog(this.name, msg.logs, msg.logType);
                    }
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
                    if ((msg.nodePositions)) {
                        this.server.saveNodePositions(msg.nodePositions)
                    }
                    break;

                case "createVirtualDevice":
                    if ((msg.name && msg.inputs && msg.outputs)) {
                        this.server.createVirtualDevice(msg.name,msg.inputs, msg.outputs, true)
                    }
                  break;
                    
                case "requestIO":
                    this.sendMessage(JSON.stringify(
                        this.server.getDeviceIO()
                    ))
                    break;

                case "requestLink":
                    if ((msg.outputDeviceName && msg.outputName && msg.inputDeviceName && msg.inputName)) {
                        this.server.requestLink(msg.outputDeviceName, msg.outputName, msg.inputDeviceName, msg.inputName, false);
                    }
                    break;

                case "breakLink":
                    if ((msg.outputDeviceName && msg.outputName && msg.inputDeviceName && msg.inputName)) {
                        let linkName = `${msg.outputDeviceName}-${msg.outputName}=>${msg.inputDeviceName}-${msg.inputName}`;
                        this.server.breakLinkByName(msg.linkName)
                    }
                    break;

                case "requestPersistentLink":
                    if ((msg.outputDeviceName && msg.outputName && msg.inputDeviceName && msg.inputName)) {
                        this.server.addPersistentLink(msg.outputDeviceName, msg.outputName, msg.inputDeviceName, msg.inputName, msg.encrypt_algorithm, msg.key_size, msg.highest_compatible, msg.isHybrid)
                        break;
                    }

                case "breakPersistentLink":
                    if ((msg.outputDeviceName && msg.outputName && msg.inputDeviceName && msg.inputName)) {
                        this.server.breakPersistentLink(msg.outputDeviceName, msg.outputName, msg.inputDeviceName, msg.inputName)
                    }
                    break;


                case "updatePersistentLink":
                    if ((msg.outputDeviceName && msg.outputName && msg.inputDeviceName && msg.inputName)) {
                        this.server.updatePersistentLink(msg.linkName, msg.outputDeviceName, msg.outputName, msg.inputDeviceName, msg.inputName, 
                                    msg.encrypt_algorithm, msg.key_Length, msg.prefer_Highest_Key, msg.isHybrid)
                    }
                    break;

                case "removeDeviceByName":
                    if (msg.deviceName) {
                        this.server.removeDeviceByName(msg.deviceName)
                    }
                    break;

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
                    if (msg.linkName) {
                        this.server.breakLinkByName(msg.linkName)
                    }
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
                        this.server.addLog("Server",`Invalid Status ${msg.statusState}} from Device ${this.name}`, "error")
                    }
                    break;

                case "requestEditIO":
                    if (msg.device && msg.ioName && msg.editIOData) {
                        this.server.sendMessageToDevice(msg.device, JSON.stringify({
                            type: "updateIO",
                            ioName: msg.ioName,
                            editIOData: msg.editIOData,
                        }))
                    }
                    break;

                case "updateWidgets":
                    if (msg.widgetName && msg.widget) {
                        this.modify_widget(msg.widgetName, msg.widget);
                    }
                    break;

                case "updateWidgetsKeyPair":
                    if (msg.widgetName && msg.keyPair) {
                        this.modify_widget_key_pair(msg.widgetName, msg.keyPair) 
                    }
                    break;
            }
        })
        this.pingInterval = setInterval(() => {
            if (this.ws.readyState === 1) {
                this.ws.ping('.', false);
            } 
        }, 1000);
    }
    
    deactivate() {
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
            inputs:        {},
            outputs:       {},
            all_inputs:    [],
            all_outputs:   [],
            widgets:       [],
            deviceInfo:    this.deviceInfo,
            nodePosition:  this.nodePosition,
            isNode:        this.isnode,
            connectedTo:   this.getConnectedDevices(),
            statusState:   this.statusState,
            supportedEncryptionStandards:  this.supportedEncryptionStandards,
        }

        this.inputs.forEach((input, inputName) => {
            availableIO.all_inputs.push(inputName)
            // if (input.isAvailable) {
                availableIO.inputs[inputName] = input.dataType
            // }
        })
    
        this.outputs.forEach((output, outputName) => {
            availableIO.all_outputs.push(outputName)
            // if (output.isAvailable) {
                availableIO.outputs[outputName] = output.dataType
            // }
        })
        this.widgets.forEach((widget, widgetName) => {
            availableIO.widgets[widgetName] = widget
        })

        return availableIO

    }

    sendMessage(message) {
        this.ws.send(message)
    }
    
}

class VIRTUALDEVICE {
    constructor(serverContext, name, inputs, outputs, deviceInfo, isNode) {
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
        this.isNode        = false
        if (isNode) { 
            this.isNode    = true
        }
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
                    isNode:      this.isNode,
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
            if (!this.serverContext.connectedDevices.has(this.name)) {
                 this.localContext.intervalArray.forEach((interval) => {
                    clearInterval(interval)
                })
                this.serverContext.addLog(this.name, `DEVICE: Virtual ${this.name} deactivated intervals`, 'info')
                clearInterval(checkerInterval)
            }
        }, 5000)

    }
}

class IO {
    constructor(name, device, isInput, dataType = "typeless") {
        this.name = name;
        this.device = device;
        this.deviceName = device.name
        this.isInput = isInput;
        this.isAvailable = true;
        this.dataType = dataType; // typeless, integer, Float, array
        this.outputEventListeners = {}; // This is sent out of this device. to other devices. Output ->
        if (this.isInput) {
            this.sendInputToDevice()
        }
    }

    getDataType() {
        return this.dataType;
    }

    setAvailability(isAvailable) {
        this.isAvailable = isAvailable;
    }

    addListener(listenerName) {
        let listener = new VariableWatcher(false);
        this.outputEventListeners[listenerName] = listener;
        return listener;
    }

    removeListener(listenerName) {
        if (this.outputEventListeners[listenerName]) {
            this.outputEventListeners[listenerName].removeAllListeners("change");
            delete this.outputEventListeners[listenerName];
        }
    }

    sendInputToDevice() {
        let listener = new VariableWatcher(false);
        this.outputEventListeners['default'] = listener
        listener.on("change", (value) => {
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
        Object.entries(this.outputEventListeners).forEach(([key, variablewatcher]) => {
            variablewatcher.removeAllListeners("change");
        })
    }
        // this.eventListener.removeAllListeners("change");

    setIOEventListenerVariable(value) {
        Object.entries(this.outputEventListeners).forEach(([key, variablewatcher]) => {
            variablewatcher.setVariable(value)
        })
    }

    sendMessage(msg) {
        this.device.sendMessage(msg) 
    }

    getMessageEventListener() {
        return this.eventListener
    }
}

const server = new SERVER(8080, "webClient", "savedData.json")  
