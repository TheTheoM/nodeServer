const WebSocket               = require('ws');
const EventEmitter            = require('events');
const { PassThrough }         = require('stream');
const { error, Console, log } = require('console');
const fs                      = require('fs');
const { setTimeout }          = require('timers');
const { spawn }               = require('child_process');
var   pidusage                = require('pidusage')
const osInfo                  = require("@felipebutcher/node-os-info");
const os                      = require('os');
const disk                    = require('diskusage');
const bcrypt                  = require('bcrypt');
const jwt                     = require('jsonwebtoken');
const crypto                  = require("crypto");
const yargs                   = require("yargs/yargs");
const { hideBin }             = require("yargs/helpers");

const Database                = require('better-sqlite3');
const db    =   new Database('nodeDatabase.db');

// const db = new Database('app.db', { verbose: console.log });

function isDict(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}


class Process {
    constructor(runTime, path, processName, args, restart_on_error, max_restart_count, startup, serverContext, processManagerContext) {
        this.serverContext = serverContext;
        this.processManagerContext = processManagerContext;
        this.processName = processName;
        this.args = args;
        this.path = path
        this.restart_on_error = restart_on_error;
        this.max_restart_count = max_restart_count;
        this.startup = startup;
        this.runTime = runTime; //node python3 etc
        this.status = "INACTIVE";
        this.processManagerContext.editProcess(this.processName, "status", "INACTIVE");

        this.PID;
        this.resourceUsage = {};
        this.resourcePollingInterval = 1000;
        this.current_restart_count = 0;
        
    }

    start() {
        this.process = spawn(this.runTime, [this.path, ...this.args]);
        this.PID = this.process.pid
        this.status = "ACTIVE";
        this.processManagerContext.editProcess(this.processName, "status", "ACTIVE");

        this.process.stdout.on('data', (data) => {
        console.log(`${this.processName}: ${data}`);
        });

        this.process.stderr.on('data', (data) => {
            this.serverContext.addLog("Server",`PROCESS ERROR [STDERR] ${this.processName}: ${data}`, "error");
            console.error(`[STDERR] ${this.processName}: ${data}`);
            if (this.restart_on_error) {
                if ((this.current_restart_count >= this.max_restart_count) && (this.max_restart_count !== -1)) {
                    return
                }
                this.current_restart_count++
                setTimeout(() => {
                    this.restart()
                }, 2000)
            }
        });

        this.process.on('close', (code) => {
            this.serverContext.addLog("Server",`Process "${this.processName}" exited with code ${code}`, "info");
            console.log(` process "${this.processName}" exited with code ${code}`);
        });

        console.log(`Process ${this.processName} started.`);
    }

    kill() {
        if (this.status === "ACTIVE") {
            if (this.process.kill()) {
                this.processManagerContext.editProcess(this.processName, "status", "INACTIVE");
                this.status = "INACTIVE"
                return true
            }
            return false
        }
    }

    restart() {
        if (this.kill()) {
            this.start();
        } else {
            this.serverContext.addLog("Server",`PROCESS ERROR Process ${this.processName} cannot be killed. `, "error");
        }
    }
}


class ProcessManager {
    constructor(sendProcesses, sendProcessesResources, serverContext) {
        this.processes = {};
        this.sendProcesses = sendProcesses;
        this.serverContext = serverContext
        this.loadProcesses();
        this.resourcePollingInterval = 4000;
        this.get_all_process_resources(sendProcessesResources)

    }

    loadProcesses() {

        let savedProcesses = db.prepare(`SELECT * FROM processes`).all()
        for (const [index, processInfo] of Object.entries(savedProcesses)) {

            let name = processInfo.processName

            this.processes[name] = new Process(
                processInfo.runtime,
                processInfo.path,
                name,
                processInfo.args,
                processInfo.restart_on_error,
                processInfo.max_restart_count,
                processInfo.startup,
                this.serverContext,
                this
            );

            this.serverContext.addLog("Server",`[PROCESS MANAGER]: Process ${name} loaded.`, "info");

            if (processInfo.startup) {
                this.startProcess(name)
            } 
        }
        
        this.sendProcesses()
    }


    getProcessDataToSave() {
        let extractedProcesses = {}

        for (const [name, process] of Object.entries(this.processes)) {
            extractedProcesses[name] = {
                runTime: process.runTime,
                path: process.path,
                processName: name,
                args: process.args,
                restart_on_error: process.restart_on_error,
                max_restart_count: process.max_restart_count,
                status: process.status,
                startup: process.startup,
            };
        }

        return extractedProcesses
    }

    addProcess(runTime,  path,  name , args = [], restart_on_error,  max_restart_count,  startup) {
        if (this.processes[name]) {
            this.serverContext.addLog("Server",`[PROCESS MANAGER]: [ERROR] Process ${name} already exists.`, "error");
            return true;
        }

        if (!fs.existsSync(path) || !fs.lstatSync(path).isFile()) {
            this.serverContext.addLog("Server",`[PROCESS MANAGER]: [ERROR] Invalid path for process ${name}: ${path}`, "error");
            return true;
        }

        const newProcess = new Process(runTime, path, name, args, restart_on_error, max_restart_count, startup, this.serverContext, this);
        this.processes[name] = newProcess;
        
        
        const stmt = db.prepare(`
            INSERT INTO processes (processName, runtime, path, args, restart_on_error, status, max_restart_count,  startup)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            name,
            runTime,
            path,
            JSON.stringify(args),
            restart_on_error ? 1 : 0,
            "INACTIVE",
            max_restart_count,
            startup ? 1 : 0
        );
        
        this.serverContext.sendProcesses();
        this.serverContext.addLog("Server",`[PROCESS MANAGER]: Process ${name} added with path ${path}`, "info");

        return true;

    }

    editProcess(name, field, value, isValueBoolean = false) {
        // If values are true/false they HAVE to be converted to 1/0. Otherwise sqlite will whine. Hence the isValueBoolean flag.

        if (isValueBoolean) {
            value = value ? 1 : 0
        }

        const query = `UPDATE processes SET ${field} = :value WHERE processName = :name`;
        const values = {
            value: value,
            name: name
        };
        
        try {
            const result = db.prepare(query).run(values);
            this.serverContext.sendProcesses();
            return true;
        } catch (err) {
            console.log('Error executing query:', err);
            return false;
        }
        
    }
    
    startProcess(name) {
        if (!this.processes[name]) {
            this.serverContext.addLog("Server",`[PROCESS MANAGER]: [ERROR] Process ${name} does not exist.`, "error");
            return false;
        }

        let process = this.getProcess(name)

        if (process.status === "ACTIVE") {
            this.serverContext.addLog("Server",`[PROCESS MANAGER]: [ERROR] Process ${name} is already running.`, "error");
            return false;
        }

        this.processes[name].start();
        this.serverContext.addLog("Server",`[PROCESS MANAGER]: Process ${name} started.`, "info");
        this.sendProcesses();
        return true
    }

    killProcess(name) {
        if (!this.processes[name]) {
            this.serverContext.addLog("Server",`[PROCESS MANAGER]: [ERROR] Process ${name} does not exist.`, "error");
            return false;
            
        }

        if (this.processes[name].status === "INACTIVE") {
            this.serverContext.addLog("Server",`[PROCESS MANAGER]: Process  ${name} is inactive hence not deleted.`, "warning");
            return false;
        }

        this.processes[name].kill();
        this.serverContext.addLog("Server",`[PROCESS MANAGER]: Process ${name} deleted.`, "info");
        this.sendProcesses();
        return true;

    }

    removeProcess(name) {
        this.killProcess(name);
        
        delete this.processes[name];
    
        this.serverContext.addLog("Server", `[PROCESS MANAGER]: Process ${name} removed from file.`, "info");
    
        const query = `DELETE FROM processes WHERE processName = :name`;
        const values = { name: name };
        
        try {
            db.prepare(query).run(values);
            console.log(`Process ${name} removed from SQL database.`);
        } catch (err) {
            console.error(`Error removing process ${name} from SQL database:`, err);
            this.serverContext.addLog("Server", `[PROCESS MANAGER]: [ERROR] Failed to remove process ${name} from SQL database.`, "error");
            return false;
        }
    
        // this.saveProcesses();
        this.sendProcesses();
        
        return true;
    }
    

    getProcess(name) {
        return this.processes[name];
    }

    restartProcess(name) {
        if (!this.processes[name]) {
            this.serverContext.addLog("Server",`[PROCESS MANAGER]: [ERROR] Process ${name} does not exist.`, "error");
            return false;
        }
        this.processes[name].restart();
        this.sendProcesses();
        return true;

    }

    getAllProcesses() {
        try {

            let savedProcesses = db.prepare(`SELECT * FROM processes`).all()
            const processes = {};

            for (const [index, processInfo] of Object.entries(savedProcesses)) {
                processes[processInfo.processName] = processInfo;
            }            

            return processes;
        } catch (error) {
            this.serverContext.addLog("Server",`[PROCESS MANAGER]: [ERROR] Failed to retrieve processes from database: ${error.message}`, "error");
            return {};
        }
    }

    async get_all_process_resources(sendProcessesResources) {
        setInterval(async () => {
            try {   
                let resourceData = {}
    
                for (const [processName, process] of Object.entries(this.processes)) {
                    try {
                        const stats = await pidusage(process.PID);
                        resourceData[processName] = {
                            "cpu": stats.cpu, 
                            memory: (stats.memory / (1024 * 1024)).toFixed(2),      
                            elapsed: Math.round((stats.elapsed / 1000).toFixed(2)) 
                        };
                    } catch {
                        resourceData[processName] = {
                            "cpu": -1, 
                            memory: -1,  
                            elapsed: -1, 
                        };
                    }
                }
    
                sendProcessesResources(resourceData);
    
            } catch (error) {
                this.serverContext.addLog("Server",`[PROCESS MANAGER]: [ERROR] Failed to get Process Resources : ${error.message}`, "error");
                return {};
            }
        }, this.resourcePollingInterval);
    }
    
    
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
            "set":         this.set,
            "get":         this.get,
            "deleteItem":  this.deleteItem,
            "has":         this.has,
            "forEach":     this.forEach,
            "map":         this.map,
            "getMap":      this.getMap,
            "runOnUpdate": this.runOnUpdate,
          };
    }

}


class SERVER {
    constructor(port = 8080, reactClientName = "webClient", username = undefined, password = undefined) {
        this.server           = new WebSocket.Server({ port: port, pingInterval: 5000, pingTimeout: 1000 });
        this.activeLinks      = new ObservableMap(this.on_activeLinks_Change.bind(this)).getMapFunctions()
        this.connectedDevices = new Map();
        this.persistentLinks  = new ObservableMap(this.on_PersistentLinks_Update.bind(this)).getMapFunctions();
        this.reactClientName  = reactClientName;
        this.sendReactUpdate  = true;
        this.serverLogVirtDevice;
        this.createSQLITETables()
        this.logFilters = { selectedDevices: [], time: { "from": new Date("2000-01-01"), "to": new Date() },
            alerts: ["warning", "error", "info", "success"], search: "" };
        this.serverContext = this;
        this.printLogs     = true;
        this.sendUpdate    = true;
        this.pingTimeout   = 1500;
        this.messagesPerSecond = 5;
        this.backupInterval = 1800000;
        this.rateLimits = {};
        this.pollComputerPerformanceInterval = 5000;
        this.computerPerformanceData = {};
        this.JWT_SECRET = this.createEnvFileWithSecret();
        this.getComputerPerformance();
        this.manager = new ProcessManager(this.sendProcesses.bind(this), this.sendProcessesResources.bind(this), this.serverContext);
        this.loadLinks();

        setInterval(() => {
            this.trimDeviceLogs(300)
        }, 100000)

        if (username && password) {
            console.log("yes we are adding user.")
            this.addUser(username, password);
        }
        this.main();
    }

    createSQLITETables() {
        // LINK SQL TABLE
        //  probably add the processes thing to this too.
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                link_name TEXT UNIQUE NOT NULL,
                output_device_name TEXT NOT NULL,
                output_name TEXT NOT NULL,
                input_device_name TEXT NOT NULL,
                input_name TEXT NOT NULL,
                encrypt_algorithm TEXT,
                key_size INTEGER,
                highest_compatible TEXT,
                is_hybrid BOOLEAN
            );

            CREATE TABLE IF NOT EXISTS devices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                position_x INTEGER NOT NULL,
                position_y INTEGER NOT NULL
            );
    
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id INTEGER NOT NULL,
                log TEXT NOT NULL,
                log_type TEXT NOT NULL,
                log_time DATETIME NOT NULL,
                FOREIGN KEY (device_id) REFERENCES devices(id)
            );

            CREATE TABLE IF NOT EXISTS processes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                processName TEXT UNIQUE NOT NULL,
                runtime TEXT NOT NULL,
                path TEXT NOT NULL,
                args TEXT,
                restart_on_error BOOLEAN NOT NULL,
                status TEXT NOT NULL,
                max_restart_count INTEGER NOT NULL,
                startup BOOLEAN NOT NULL
            );
        `);
    }


    wipeLinksTable() {
        try {
            const currentTime = new Date().toISOString(); // Get the current time in ISO string format
    
            // Drop and recreate the links table
            db.exec(`
                DROP TABLE IF EXISTS links;
                CREATE TABLE links (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    link_name TEXT UNIQUE NOT NULL,
                    output_device_name TEXT NOT NULL,
                    output_name TEXT NOT NULL,
                    input_device_name TEXT NOT NULL,
                    input_name TEXT NOT NULL,
                    encrypt_algorithm TEXT,
                    key_size INTEGER,
                    highest_compatible TEXT,
                    is_hybrid BOOLEAN
                );
            `);
    
            this.serverContext.addLog("Server", `[${currentTime}] [DATABASE]: Successfully wiped and recreated the 'links' table.`, "info");
            return true; // Indicate success
        } catch (error) {
            const currentTime = new Date().toISOString(); // Ensure we log the time in case of an error
            this.serverContext.addLog("Server", `[${currentTime}] [DATABASE]: [ERROR] Failed to wipe 'links' table: ${error.message}`, "error");
            return false; // Indicate failure
        }
    }


    addDeviceToDatabase(name) {
        // If device not already in the database, add it.
        try {
            const checkStmt = db.prepare(`
                SELECT COUNT(*) AS count FROM devices WHERE name = ?
            `);
            const result = checkStmt.get(name);
    
            if (result.count > 0) {
                // this.serverContext.addLog("Server", `[DATABASE]: Device with name '${name}' already exists. Skipping insertion.`, "info");
                return false;
            }
    
            const insertStmt = db.prepare(`
                INSERT INTO devices (name, position_x, position_y)
                VALUES (?, ?, ?)
            `);
            insertStmt.run(name, 0, 0);
            this.serverContext.addLog("Server", `[DATABASE]: Device '${name}' added to the database.`, "info");
            return true;
        } catch (error) {
            this.serverContext.addLog("Server", `[DATABASE]: [ERROR] Failed to add device '${name}': ${error.message}`, "error");
            return false; 
        }
    }

    
    main() {
        this.monitorClientConnections()
        this.serverLogVirtualDevice = this.createVirtualDevice("Server", {}, {}, false)  // This creates the server as a device, so it can log.
        
        this.server.on('connection', (socket, req) => {
            socket.isAlive = true;

            this.addLog("Server", "Device: Device connected.", "info")
            let ip = req.socket.remoteAddress
            socket.on('message', (msg) => {
                msg = JSON.parse(msg)
                if (msg.type === "registerDevice") {
                    this.addLog("Server",  `Device: ${msg.name} registered. Ip: ${ip}`, "info")

                    if (this.connectedDevices.has(msg.name)) { 
                        let newName = msg.name;
                        let baseName = msg.name;
                        let i = 1;
                        // Check if the device name ends with a number (e.g., "bob-1") using regex.
                        // This helps in incrementing the name systematically if a conflict exists.
                        const match = msg.name.match(/(.*?)(\d+)$/); 
                        if (match) {
                            baseName = match[1]; 
                            i = parseInt(match[2], 10) + 1;
                        }
                
                        while (this.connectedDevices.has(newName)) {
                            newName = `${baseName}-${i}`;
                            i++;
                        }
                
                        socket.send(JSON.stringify({
                            type: "nameTaken",
                            proposedName: newName,
                        }));
                 
                    
                        setTimeout(() => {
                            socket.close();
                        }, 500);

                    } else {
                        const isProcess = !!this.manager.getProcess(msg.name);


                        let device = new DEVICE(socket, this.serverContext, msg.name, msg.inputNames,
                                                msg.outputNames, msg.deviceInfo, msg.widgets, msg.isNode, isProcess,
                                                msg.supportedEncryptionStandards)

                        
                        device.sendMessage(JSON.stringify({
                            type: "connected"
                        }))
                        
                        if (device.name.includes(this.reactClientName)) {
                            // The initial information the dashboard needs to display.
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

                            device.sendMessage(JSON.stringify({
                                type: "getAllProcesses",
                                processes: this.manager.getAllProcesses(),
                            }));

                        }
                        this.connectedDevices.set(device.name, device)
                        this.checkForPersistentLink();
                        this.checkDeviceSavedData(device.name)

                    }
                }
            })
            socket.on('pong', () => {
                socket.isAlive = true;
            })
        })
    }


    monitorClientConnections() {
        const interval = setInterval(() => {
            this.server.clients.forEach((ws) => {
                if (ws.isAlive === false) return ws.terminate();
                
                ws.isAlive = false;
                ws.ping();
            });
        }, 3000);
    }
    

    getComputerPerformance() {
        function getMemoryUsage() {
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;
          
            return {
              totalMemory: (totalMemory / (1024 ** 3)).toFixed(1), 
              usedMemory:  (usedMemory / (1024 ** 3)).toFixed(1), 
              freeMemory:  (freeMemory / (1024 ** 3)).toFixed(1)  
            };
          }
        
        async function getStorageUsage(path = '/') {
            try {
              const info = await disk.check(path);
              return {
                totalStorage: (info.total / (1024 ** 3)).toFixed(1), 
                freeStorage:  (info.free / (1024 ** 3)).toFixed(1),   
                usedStorage: ((info.total - info.free) / (1024 ** 3)).toFixed(1) 
              };
            } catch (err) {
              console.error(`Error getting storage usage for ${path}:`, err);
            }
          }
        
        function getCpuUsage() {
            return new Promise((resolve) => {
                osInfo.cpu((cpu) => {
                    resolve((cpu * 100).toFixed(1)); 
                });
            });
        }
        
        function getMemUsage() {
            return new Promise((resolve) => {
                osInfo.mem((memory) => {
                    resolve((memory * 100).toFixed(1)); 
                });
            });
        }
        
        function getDiskUsage() {
            return new Promise((resolve) => {
                osInfo.mem((disk ) => {
                    resolve((disk  * 100).toFixed(1)); 
                });
            });
        }

        setInterval(async () => {
            try {
                const cpuUsagePercentage  = await getCpuUsage();
                const memUsagePercentage  = await getMemUsage();
                const diskUsagePercentage = await getDiskUsage();
                
                const { totalMemory, usedMemory, freeMemory } = getMemoryUsage();
                const { totalStorage, freeStorage, usedStorage } = await getStorageUsage();
        
                this.computerPerformanceData = {
                    totalMemory,
                    usedMemory,
                    freeMemory,
                    memUsagePercentage,
                    totalStorage,
                    freeStorage,
                    usedStorage,
                    diskUsagePercentage,
                    cpuUsagePercentage
                };

                this.on_ComputerPerformanceData_Update()

            } catch (error) {
                this.addLog("Server", `Error getting Computer Resources: ${error}`, "error");
            }
        }, this.pollComputerPerformanceInterval);
    }


    on_ComputerPerformanceData_Update() {
        if (this.sendReactUpdate) {
            this.connectedDevices.forEach((device) => {
                if (device.name.includes(this.reactClientName)) {
                    device.sendMessage(
                        JSON.stringify({
                            type: "computerPerformanceData",
                            computerPerformanceData: this.computerPerformanceData,
                        })
                    );
                }
            });
        }
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
    

    sendProcesses() {
        if (this.sendReactUpdate) {
            this.connectedDevices.forEach((device) => {
                if (device.name.includes(this.reactClientName)) {
                    device.sendMessage(
                        JSON.stringify({
                            'type': "getAllProcesses",
                            'processes': this.manager.getAllProcesses(),
                        })
                    );
                }
            });
        }
    }


    createEnvFileWithSecret() {
        const envFilePath = './.env';

        let byteLength = 64;
    
        if (!fs.existsSync(envFilePath)) {
            const secretKey = crypto.randomBytes(byteLength).toString('hex');
            fs.writeFileSync(envFilePath, `JWT_SECRET=${secretKey}\n`);

            return secretKey;
        }
    
        const envFileContent = fs.readFileSync(envFilePath, 'utf8');
        const match = envFileContent.match(/JWT_SECRET=(.+)/);

        return match[1].length == byteLength * 2  ? match[1].trim() : null;
    }
    

    async checkCredentials(username, password) {
        if (username.length === 0 || password.length === 0) {
            this.serverContext.addLog("Server", "[AUTH]: Username or password is empty.", "error");
            return false;
        }
    
        const stmt = db.prepare(`SELECT password FROM users WHERE username = ?`);
        const user = stmt.get(username);
    
        if (!user) {
            this.serverContext.addLog("Server", `[AUTH]: Login failed for username '${username}' - User not found.`, "warning");
            return false;
        }
    
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            this.serverContext.addLog("Server", `[AUTH]: Login successful for username '${username}'.`, "info");
            return true;
        }
    
        this.serverContext.addLog("Server", `[AUTH]: Login failed for username '${username}' - Incorrect password.`, "warning");
        return false;
    }
    
    
    async addUser(username, password) {
        const checkStmt = db.prepare(`SELECT COUNT(*) AS count FROM users WHERE username = ?`);
        const { count } = checkStmt.get(username);
    
        if (count > 0) {
            console.log(`User ${username} already exists`);
            return;
        }
    
        const hashedPassword = await bcrypt.hash(password, 10);
        const insertStmt = db.prepare(`INSERT INTO users (username, password) VALUES (?, ?)`);
        insertStmt.run(username, hashedPassword);
        console.log(`User ${username} added successfully`);
    }


    removeUser(username) {
        const deleteStmt = db.prepare(`DELETE FROM users WHERE username = ?`);
        const result = deleteStmt.run(username);
    
        if (result.changes > 0) {
            console.log(`User ${username} removed successfully`);
        } else {
            console.log(`User ${username} not found`);
        }
    }
    

    sendProcessesResources(resourceData) {
        if (this.sendReactUpdate) {
            this.connectedDevices.forEach((device) => {
                if (device.name.includes(this.reactClientName)) {
                    device.sendMessage(
                        JSON.stringify({
                            'type': "getAllProcessResources",
                            'processes': resourceData,
                        })
                    );
                }
            });
        }
    }


    sendDashboardNotifications(dashboardNotification, notificationType) {
        if (this.sendReactUpdate) {
            this.connectedDevices.forEach((device) => {
                if (device.name.includes(this.reactClientName)) {
                    device.sendMessage(
                        JSON.stringify({
                            'type': "dashboardNotification",
                            'dashboardNotification':    dashboardNotification,
                            'notificationType':         notificationType,
                        })
                    );
                }
            });
        }
    }


    addLog(deviceName, log, logType) {
        // Need to implement maximum logs, so it deletes oldest logs. Also rate limiting.
        
        if (this.printLogs && deviceName === "Server") {
            console.log(log);
        }

        if (!this.connectedDevices.has(deviceName)) {
            console.log(`Failure to add log. Device ${deviceName} doesn't exist.`);
            return null;
        }

        if (deviceName.includes("webClient") || log === undefined|| logType === undefined) {
            return null;
        }
        
        const device = db.prepare(`
            SELECT id FROM devices WHERE name = ?
            `).get(deviceName);
            
        if (!device) {
            throw new Error(`Device with name "${deviceName}" not found.`);
        }
        
        const stmt = db.prepare(`
            INSERT INTO logs (device_id, log, log_type, log_time)
            VALUES (?, ?, ?, ?)
        `);
        
        const currentTime = new Date().toISOString(); 
        stmt.run(device.id, log, logType, currentTime);

        // Problematic, cause high volume of logs would spam the webclients.
        // Problematic, cause high volume of logs would spam the webclients.
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
    }

   
    modifyFilters(filters) {
        for (const key of Object.keys(filters)) {
            if (key === "alerts") {
                this.logFilters[key] = filters[key].map((key) => (key.toLowerCase()))
            } else {
                this.logFilters[key] = filters[key]
            }
        }

        this.on_deviceLogs_Change()
    }


    saveNodePositions(nodePositions) {
        try {
            const updateStmt = db.prepare(`
                UPDATE devices
                SET position_x = ?, position_y = ?
                WHERE name = ?
            `);
    
            const transaction = db.transaction((positions) => {
                positions.forEach((nodeData) => {
                    if (Object.keys(nodeData.position).length === 0 && nodeData.position.constructor === Object) {
                        return
                    }
                    const {position, name} = nodeData;
                    updateStmt.run(position.x, position.y, name);
                    let device = this.connectedDevices.get(nodeData.name)
                    if (device) {
                        device.setPosition(position)
                    }

                });
            });
    
            transaction(nodePositions);
        } catch (error) {
            this.serverContext.addLog("Server", `[DATABASE]: [ERROR] Failed to save node positions: ${error.message}`, "error");
        }
    }


    getDevicePosition(name) {
        try {
            const stmt = db.prepare(`
                SELECT position_x, position_y FROM devices WHERE name = ?
            `);
            const result = stmt.get(name);
            return result ? { x: result.position_x, y: result.position_y } : null;
        } catch {
            return null;
        }
    }
    

    checkDeviceSavedData(name) {
        // Adds device to database, with position as x,y = 0, 0. If it already exists, read its position.
        if (!this.addDeviceToDatabase(name)) {
            const {x, y} = this.getDevicePosition(name);
            let device = this.connectedDevices.get(name)
            if (device) {
                device.setPosition({x: x, y: y})
            }
        }

    }


    loadLinks() {
    
        try {
            let query = `SELECT * FROM links`;
            let links = db.prepare(query).all(); 

            if (links.length > 0) {
                links.forEach((link) => {
                    this.requestLink(
                        link.output_device_name, 
                        link.output_name, 
                        link.input_device_name, 
                        link.input_name, 
                        true,
                        link.encrypt_algorithm, 
                        link.key_size, 
                        link.highest_compatible, 
                        link.is_hybrid)
                    });
            } else {
                console.log("No links found in the database.");
            }
        } catch (error) {
            console.error("Error loading links from database:", error.message);
        }
    }
    

    createVirtualDevice(name,inputs, outputs, isNode) {
        this.addDeviceToDatabase(name)
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
        try {
            const stmt = db.prepare(`
                SELECT 
                    link_name,
                    output_device_name,
                    output_name,
                    input_device_name,
                    input_name,
                    encrypt_algorithm,
                    key_size,
                    highest_compatible,
                    is_hybrid
                FROM links
            `);
    
            const rows = stmt.all();
            const persistentLinksData = {};
    
            rows.forEach(row => {
                persistentLinksData[row.link_name] = {
                    outputDevice: row.output_device_name,
                    outputName: row.output_name,
                    inputDevice: row.input_device_name,
                    inputName: row.input_name,
                    encryptAlgorithm: row.encrypt_algorithm,
                    keySize: row.key_size,
                    highestCompatible: row.highest_compatible,
                    isHybrid: row.is_hybrid
                };
            });

            return persistentLinksData;
        } catch (error) {
            this.serverContext.addLog("Server", `[DATABASE]: [ERROR] Failed to retrieve persistent links: ${error.message}`, "error");
            return {};
        }
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
        let logFilters = this.logFilters;
    
        const selectedDevices = logFilters.selectedDevices.join("','");
        const alertTypes = logFilters.alerts.join("','");
        const searchFilter = `%${logFilters.search.toLocaleLowerCase()}%`;
    
        const query = `
            SELECT logs.*, devices.name
            FROM logs
            JOIN devices ON logs.device_id = devices.id
            WHERE devices.name IN ('${selectedDevices}')
              AND logs.log_type IN ('${alertTypes}')
              AND (logs.log LIKE ? OR logs.log_type LIKE ?)
            ORDER BY logs.log_time ASC
        `;
    
        // Fetch all relevant logs and truncate to limit in code
        const allLogs = db.prepare(query).all(searchFilter, searchFilter);
        const limit = logFilters.limit || 200; // Default limit to 10
        return allLogs.slice(0, limit);
    }


    trimDeviceLogs(maxLogs) {
        const devicesQuery = `SELECT id FROM devices`;
        const devices = db.prepare(devicesQuery).all();
    
        devices.forEach(device => {
            const deviceId = device.id;
    
            const countQuery = `
                SELECT COUNT(*) AS logCount
                FROM logs
                WHERE device_id = ?
            `;
            const { logCount } = db.prepare(countQuery).get(deviceId);
            if (logCount > maxLogs) {
                console.log(logCount)
                console.log(maxLogs)
                const excessLogs = logCount - maxLogs;
    
                const deleteQuery = `
                    DELETE FROM logs
                    WHERE id IN (
                        SELECT id
                        FROM logs
                        WHERE device_id = ?
                        ORDER BY log_time ASC
                        LIMIT ?
                    )
                `;
                db.prepare(deleteQuery).run(deviceId, excessLogs);
    
                console.log(`Deleted ${excessLogs} old logs for device ID: ${deviceId}`);
            }
        });
    
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
                
                this.on_PersistentLinks_Update()
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

        let checkQuery = `SELECT 1 FROM links WHERE link_name = ?`;
        let existingLink = db.prepare(checkQuery).get(linkName);
        if (existingLink) {
            this.addLog("Server", `Persistent Link: ${linkName} Already Exists.`, "error");
            return false;
        }
        let insertQuery = `
            INSERT INTO links (
                link_name, 
                output_device_name, 
                output_name, 
                input_device_name, 
                input_name, 
                encrypt_algorithm, 
                key_size, 
                highest_compatible, 
                is_hybrid
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(insertQuery).run(
            linkName,
            outputDeviceName,
            outputName,
            inputDeviceName,
            inputName,
            encrypt_algorithm,
            key_size,
            highest_compatible,
            isHybrid
        );


        this.addLog("Server", `Persistent Link: ${linkName}: Activating `, "info");
        this.checkForPersistentLink();
        this.on_PersistentLinks_Update()
        return true;
    }


    breakPersistentLink(outputDeviceName, outputName, inputDeviceName, inputName, linkName = null) {
        if (!linkName) {
            linkName = `${outputDeviceName}-${outputName}=>${inputDeviceName}-${inputName}`;
        }
    
        try {
            let query = `DELETE FROM links WHERE link_name = ?`;
            let result = db.prepare(query).run(linkName);
    
            if (result.changes > 0) {
                this.addLog("Server", `Persistent Link: ${linkName}:  Broken and Deactivating: `, "info");
                this.breakLinkWithIONames(outputDeviceName, outputName, inputDeviceName, inputName);
                this.on_PersistentLinks_Update()
                this.sendDashboardNotifications(`Broke Persistent Link ${linkName}`, 'success');
                return true;
            } else {
                this.addLog("Server", `Persistent Link: ${linkName}: ERROR Not Found: `, "error");
                this.sendDashboardNotifications(`Persistent Link: ${linkName}: ERROR Not Found`, 'error');
                return false;
            }
        } catch (error) {
            console.error('Error breaking persistent link in database:', error.message);
            return false;
        }
    }


    updatePersistentLink(linkName, outputDeviceName, outputName, inputDeviceName, inputName, encrypt_algorithm, key_size, highest_compatible, isHybrid) {
        if (this.breakPersistentLink(outputDeviceName, outputName, inputDeviceName, inputName, linkName = linkName)) {
            let flag = this.addPersistentLink(outputDeviceName, outputName, inputDeviceName, inputName,  encrypt_algorithm, key_size, highest_compatible, isHybrid)

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
        try {
            let query = `SELECT * FROM links`;
            let links = db.prepare(query).all();
    
            links.forEach((linkData) => {
                let inputDevice = this.connectedDevices.get(linkData.input_device_name);
                let outputDevice = this.connectedDevices.get(linkData.output_device_name);
                
                if (inputDevice && outputDevice) {
                    if (inputDevice.inputNames.has(linkData.input_name) && outputDevice.outputNames.has(linkData.output_name)) {
                        this.requestLink(
                            linkData.output_device_name, 
                            linkData.output_name, 
                            linkData.input_device_name, 
                            linkData.input_name, 
                            true, 
                            linkData.encrypt_algorithm, 
                            linkData.key_size, 
                            linkData.highest_compatible, 
                            linkData.is_hybrid
                        );
                    }
                }
            });
        } catch (error) {
            console.error('Error checking persistent links from database:', error.message);
        }
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


    removeDeviceByName(deviceName, dashboardVerbose=false) {
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
            if (dashboardVerbose) {this.sendDashboardNotifications(`Failed to delete ${deviceName}. Device not found.`, 'error')}
            this.addLog("Server", "Device not found.", "error")
        }
         if (this.connectedDevices.delete(deviceName)) {
            this.addLog("Server", `Device: ${deviceName} Deleted.`, "info")
            if (dashboardVerbose) {this.sendDashboardNotifications(`Device: ${deviceName} Deleted.`, 'success')}

            

         } else {
            this.addLog("Server", "Device not deleted.", "error")
            if (dashboardVerbose) {this.sendDashboardNotifications(`Failed to delete ${deviceName}.`, 'error')}
         }
    }


    breakLinksByDeviceName(deviceName) {
        this.activeLinks.forEach((link) => {
            if (link.outputDeviceObject.device.name === deviceName || link.inputDeviceObject.device.name === deviceName) {
                this.addLog("Server", "Link deactivated due to breakLinksByDeviceName, device Name: " + deviceName, 'info')
                link.deactivate()
            }
        })
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
                this.serverContext.activeLinks.runOnUpdate()
                return false
            }

              // Ok the issue is that the link already exists or sum shit so below doesn't run.

              outputListener.on("change", (value) => {
                this.lastMessage = JSON.stringify(value);
                this.inputDeviceObject.setIOEventListenerVariable(value);
            })

            this.outputDeviceObject.setAvailability(false)
            this.inputDeviceObject.setAvailability(false)
            this.serverContext.addLog("Server", `Link: ${this.name}: Activated`, 'info')
            return true

        } else {
            this.serverContext.addLog("Server",`Link Activation Failure: Link already Exists. Name: ${this.name}`, "error")
            return false
        }


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
    constructor(ws, serverContext, name, inputNames, outputNames, deviceInfo, widgets, isnode, isProcess, supportedEncryptionStandards) {
        this.deviceInfo = deviceInfo;
        this.supportedEncryptionStandards = supportedEncryptionStandards

        this.connectedTo = {}
        this.widgets     = new Map()
        if (widgets) {this.widgets     = widgets}
        this.validDataTypes = ['str', "int", "float", "boolean",  "array", "typeless"];



        this.validStatuses = ["offline", "online", "alert", "fault", "criticalFault"];
        this.statusState = "online";
        this.isProcess = isProcess
        this.pingInterval;
        this.server = serverContext;
        this.name = name;
        this.ws = ws;
        this.isnode = isnode;
        this.nodePosition = {x: null, y: null}
        this.deviceContext = this;
        this.inputs  = this.create_IO_objects(inputNames, true);
        this.outputs = this.create_IO_objects(outputNames,  );
        this.inputNames = new Map()
        this.outputNames = new Map()
        this.inputs.forEach((value, key) => {this.inputNames.set(value.name, value.name);});
        this.outputs.forEach((value, key) => {this.outputNames.set(value.name, value.name);});
        this.isAuthorized = false; //comment what authorization actually does.
        this.handleWSCloseAndError()
        this.main = this.main.bind(this);  // Bind `this` to the class instance
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
        this.ws.on('message', async (msg) => {
            msg = JSON.parse(msg);
            let unallowedMessageTypes = ['addProcess', 'editProcess', 'killProcess', 'startProcess', 'getProcess',
                                    'restartProcess', 'removeProcess', 'createVirtualDevice',
                                    'requestLink', 'breakLink', 'requestPersistentLink', 'breakPersistentLink', 
                                    'updatePersistentLink', 'removeDeviceByName', 'breakLink_By_LinkName']
            try {

            
                if (!this.isAuthorized && unallowedMessageTypes.includes(msg.type)) {
                    
                    this.server.sendMessageToDevice(this.name, JSON.stringify({
                        "type": 'credentialsAuthorization',
                        'authorizationState': "unauthorized"
                    }))
                    return;
                }
                
                switch (msg.type) {
                    case "registerIO": // To add/remove new inputs outputs after registration.
                        if (msg.inputNames && msg.outputNames) {
                            this.inputs.forEach((input) => {
                                input.deactivate();
                            });
                            this.outputs.forEach((output) => {
                                output.deactivate();
                            });
                            this.server.breakLinksByDeviceName(this.name)
                            this.inputs  = this.create_IO_objects(msg.inputNames, true);
                            this.outputs = this.create_IO_objects(msg.outputNames, false);
                            this.inputNames = new Map()
                            this.outputNames = new Map()
                            this.inputs.forEach((value, key) => {this.inputNames.set(value.name, value.name);});
                            this.outputs.forEach((value, key) => {this.outputNames.set(value.name, value.name);});
                            this.server.checkForPersistentLink()
                        } else {
                            this.server.addLog("Server", `Failure to register/change Device: ${this.name}'s IO, due to missing 'inputNames' and 'outputNames' fields. RCVD Msg:  ${JSON.stringify(msg)}`, "error");
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
                            this.server.addLog(this.name, JSON.stringify(msg.logs), msg.logType);
                        } else {
                            this.server.addLog("Server", `sendLogs message received with missing fields for device ${this.name}. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;
                        
                    case "addProcess":
                        if (msg.runTime && msg.path && msg.name && typeof msg.restart_on_error == 'boolean' && msg.max_restart_count && typeof msg.startup == 'boolean') {
                            this.server.manager.addProcess(msg.runTime ,  msg.path ,  msg.name , msg.args, msg.restart_on_error,  msg.max_restart_count ,  msg.startup);
                        } else {
                            this.server.addLog("Server", `addProcess message received with missing or invalid fields. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;

                    case "editProcess":
                        if (msg.name) {

                            Object.keys(msg).forEach(key => {
                                this.server.manager.editProcess(msg.name, key, msg[key], true)
                              });

                            // this.server.manager.editProcess(msg.name, msg.runTime, msg.path, msg.restart_on_error, msg.max_restart_count, msg.startup)
                            // this.server.manager.editProcess(msg.name, key, value)

                        } else {
                            this.server.addLog("Server", `editProcess message received with missing or invalid fields. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;

                
                    case "killProcess":
                        if (msg.name) {
                            let flag = this.server.manager.killProcess(msg.name);
                            if (flag) {
                                this.server.sendDashboardNotifications(`Killed process ${msg.name}.`, 'success')
                            } else {
                                this.server.sendDashboardNotifications(`Failed to kill process ${msg.name}, the process may not exist or is inactive`, 'warning')
                            }
                        } else {
                            this.server.addLog("Server", `killProcess message received with missing fields. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;
                
                    case "startProcess":
                        if (msg.name) {
                            let flag = this.server.manager.startProcess(msg.name);
                            if (flag) {
                                this.server.sendDashboardNotifications(`Started process ${msg.name}.`, 'success')
                            } else {
                                this.server.sendDashboardNotifications(`Failed to start process ${msg.name}, the process may not exist or is already running.`, 'error')
                            }
                        } else {
                            this.server.addLog("Server", `startProcess message received with missing fields. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;


                    case "getProcess":
                        if (msg.name) {
                            this.server.manager.getProcess(msg.name);
                        } else {
                            this.server.addLog("Server", `getProcess message received with missing fields. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;
                
                    case "restartProcess":
                        if (msg.name) {
                            let flag = this.server.manager.restartProcess(msg.name);
                            if (flag) {
                                this.server.sendDashboardNotifications(`Restarted process ${msg.name}.`, 'success')
                            } else {
                                this.server.sendDashboardNotifications(`Failed to restart process ${msg.name}.`, 'error')
                            }
                        } else {
                            this.server.addLog("Server", `restartProcess message received with missing fields. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;

                    case "removeProcess":
                        if (msg.name) {
                            let flag = this.server.manager.removeProcess(msg.name);
                            if (flag) {
                                this.server.sendDashboardNotifications(`Erased process ${msg.name}.`, 'success')
                            } else {
                                this.server.sendDashboardNotifications(`Failed to erase process ${msg.name}.`, 'error')
                            }
                        } else {
                            this.server.addLog("Server", `removeProcess message received with missing fields. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;

                    case "getAllProcesses":
                    this.server.sendProcesses()

                    case "modifyLogFilters":
                        if (msg.filters) {
                            this.server.modifyFilters(msg.filters);
                        } else {
                            this.server.addLog("Server", `modifyLogFilters message received without 'filters' field for device ${this.name}. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;

                        
                    case "getDeviceLogs":
                        if (msg.filters) {
                            this.sendMessage(JSON.stringify({
                                'type': "getLogs",
                                'deviceLogs': this.server.getDeviceLogs(msg.filters),
                            }));
                        } else {
                            this.server.addLog("Server", `getDeviceLogs message received without 'filters' field for device ${this.name}. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break

                    case "sendNodePositions":
                        if (msg.nodePositions) {
                            this.server.saveNodePositions(msg.nodePositions);
                        } else {
                            this.server.addLog("Server", `sendNodePositions message received without 'nodePositions' field. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;
                    
                    case "createVirtualDevice":
                        if (msg.name && msg.inputs && msg.outputs) {
                            this.server.createVirtualDevice(msg.name, msg.inputs, msg.outputs, true);
                        } else {
                            this.server.addLog("Server", `createVirtualDevice message received with missing fields. Required: 'name', 'inputs', 'outputs'. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;
                    
                    case "requestIO":
                        try {
                            this.sendMessage(JSON.stringify(this.server.getDeviceIO()));
                        } catch (error) {
                            this.server.addLog("Server", `Error in requestIO: ${error.message}`, "error");
                        }
                        break;
                    
                    case "requestLink":
                        if (msg.outputDeviceName && msg.outputName && msg.inputDeviceName && msg.inputName) {
                            this.server.requestLink(msg.outputDeviceName, msg.outputName, msg.inputDeviceName, msg.inputName, false);
                        } else {
                            this.server.addLog("Server", `requestLink message received with missing fields. Required: 'outputDeviceName', 'outputName', 'inputDeviceName', 'inputName'. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;
                    
                    case "breakLink":
                        if (msg.outputDeviceName && msg.outputName && msg.inputDeviceName && msg.inputName) {
                            let linkName = `${msg.outputDeviceName}-${msg.outputName}=>${msg.inputDeviceName}-${msg.inputName}`;
                            this.server.breakLinkByName(linkName);
                        } else {
                            this.server.addLog("Server", `breakLink message received with missing fields. Required: 'outputDeviceName', 'outputName', 'inputDeviceName', 'inputName'. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;
                        

                    case "requestPersistentLink":
                        if (msg.outputDeviceName && msg.outputName && msg.inputDeviceName && msg.inputName) {
                            let flag = this.server.addPersistentLink(
                                msg.outputDeviceName, 
                                msg.outputName, 
                                msg.inputDeviceName, 
                                msg.inputName, 
                                msg.encrypt_algorithm, 
                                msg.key_size, 
                                msg.highest_compatible, 
                                msg.isHybrid,
                            );

                            if (msg.requestedByDashboard) {break}

                            let linkName = `${msg.outputDeviceName}-${msg.outputName}=>${msg.inputDeviceName}-${msg.inputName}`;

                            if (flag) {
                                this.server.sendDashboardNotifications(`Persistent Link ${linkName} successfully created.`, 'success')
                            } else {
                                this.server.sendDashboardNotifications(`Persistent Link ${linkName} failed to create. May already exist.`, 'error')
                            }
                        } else {
                            this.server.addLog("Server", `requestPersistentLink message received with missing fields. Required: 'outputDeviceName', 'outputName', 'inputDeviceName', 'inputName'. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        this.server.on_activeLinks_Change() //To ensure to local-edge drawn on GUI gets removed.
                        break;
                    
                    case "breakPersistentLink":
                        if (msg.outputDeviceName && msg.outputName && msg.inputDeviceName && msg.inputName) {
                            this.server.breakPersistentLink(
                                msg.outputDeviceName, 
                                msg.outputName, 
                                msg.inputDeviceName, 
                                msg.inputName
                            );
                        } else {
                            this.server.addLog("Server", `breakPersistentLink message received with missing fields. Required: 'outputDeviceName', 'outputName', 'inputDeviceName', 'inputName'. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;
                    
                    case "updatePersistentLink":
                        if (msg.outputDeviceName && msg.outputName && msg.inputDeviceName && msg.inputName) {
                            this.server.updatePersistentLink(
                                msg.linkName, 
                                msg.outputDeviceName, 
                                msg.outputName, 
                                msg.inputDeviceName, 
                                msg.inputName, 
                                msg.encrypt_algorithm, 
                                msg.key_Length, 
                                msg.prefer_Highest_Key, 
                                msg.isHybrid
                            );
                        } else {
                            this.server.addLog("Server", `updatePersistentLink message received with missing fields. Required: 'outputDeviceName', 'outputName', 'inputDeviceName', 'inputName'. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;
                    
                    case "removeDeviceByName":
                        if (msg.deviceName) {
                            this.server.removeDeviceByName(msg.deviceName, true);
                        } else {
                            this.server.addLog("Server", `removeDeviceByName message received without 'deviceName' field. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;
                    
                    case "requestLinkDataInspect":
                        if (msg.linkName) {
                            let lastMessage = this.server.requestLinkDataInspection(msg.linkName);
                            this.sendMessage(JSON.stringify({
                                type: "linkInspectData",
                                linkName: msg.linkName,
                                data: lastMessage
                            }));
                        } else {
                            this.server.addLog("Server", `requestLinkDataInspect message received without 'linkName' field. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;

                    case "breakLink_By_LinkName":
                        if (msg.linkName) {
                            this.server.breakLinkByName(msg.linkName);
                        } else {
                            this.server.addLog("Server", `breakLink_By_LinkName message received without 'linkName' field. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;
                    
                    case "requestAvailableIO":
                        try {
                            let availableIO = this.server.getAvailableIO();
                            this.sendMessage(JSON.stringify({
                                type: "availableIO",
                                availableIO: availableIO
                            }));
                        } catch (error) {
                            this.server.addLog("Server", `Error in requestAvailableIO: ${error.message}`, "error");
                        }
                        break;
                    
                    case "changeStatus":
                        if (this.validStatuses.includes(msg.statusState)) {
                            this.statusState = msg.statusState;
                        } else {
                            this.server.addLog("Server", `Invalid Status ${msg.statusState} from Device ${this.name}`, "error");
                        }
                        break;
                    
                    case "requestEditIO":
                        if (msg.device && msg.ioName && msg.editIOData) {
                            this.server.sendMessageToDevice(msg.device, JSON.stringify({
                                type: "updateIO",
                                ioName: msg.ioName,
                                editIOData: msg.editIOData
                            }));
                        } else {
                            this.server.addLog("Server", `requestEditIO message received with missing fields. Required: 'device', 'ioName', 'editIOData'. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;
                    
                    case "updateWidgets":
                        if (msg.widgetName && msg.widget) {
                            this.modify_widget(msg.widgetName, msg.widget);
                        } else {
                            this.server.addLog("Server", `updateWidgets message received with missing fields. Required: 'widgetName', 'widget'. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;
                    
                    case "updateWidgetsKeyPair":
                        if (msg.widgetName && msg.keyPair) {
                            this.modify_widget_key_pair(msg.widgetName, msg.keyPair);
                        } else {
                            this.server.addLog("Server", `updateWidgetsKeyPair message received with missing fields. Required: 'widgetName', 'keyPair'. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        }
                        break;

                    case "sendCredentials":
                        const username = String(msg.username);
                        const password = String(msg.password);
                    
                        let authorizationState = "badCredentials";
                        let token = null;

                        const isAuthorized = await this.server.checkCredentials(username, password);
                        
                        if (isAuthorized) {
                            authorizationState = "authorized";
                            this.isAuthorized = true;
                            const payload = { username };
                            if (this.server.JWT_SECRET) {
                                token = jwt.sign(payload, this.server.JWT_SECRET, { expiresIn: '30d' });
                            } else {
                                console.log('ERROR: JWT_SECRET is null. Token NOT sent.')
                            }
                        }
                    
                        const response = {
                            type: "credentialsAuthorization",
                            authorizationState: authorizationState,
                            token: token,
                        };
                    
                        this.server.sendMessageToDevice(this.name, JSON.stringify(response));
                        break;

                        case "sendAuthToken":
                            let flag = false;
                            const authResponse = {};
                            authResponse.type = "tokenAuthorization"
                            if (msg.token) {
                                try {
                                    const decoded = jwt.verify(msg.token, this.server.JWT_SECRET);
                                    flag = true;
                                    this.isAuthorized = true;
                                    authResponse.authorizationState = "authorized";
                                    authResponse.message = "Token is valid";
                                    authResponse.username = decoded.username;  
                                } catch (err) {
                                    this.isAuthorized = false;
                                    console.log('ERROR in verification of token:', err);
                                    flag = false;
                                    authResponse.authorizationState = "unauthorized";
                                    authResponse.message = "Invalid or expired token";
                                }
                            } else {
                                this.isAuthorized = false;
                                authResponse.authorizationState = "unauthorized";
                                authResponse.message = "No token provided";
                            }
                        
                            this.server.sendMessageToDevice(this.name, JSON.stringify(authResponse));
                            break;

                    default:
                        this.server.addLog("Server", `Unknown message type received: ${msg.type}. RCVD Msg: ${JSON.stringify(msg)}`, "error");
                        break;
                }
            } catch (error) {
                this.server.addLog("Server", `Main Loop Crashed RCVD Msg: ${JSON.stringify(msg)} | Error: ${error.message} | Stack: ${error.stack}`, "error");
            }
        })
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
            isProcess:     this.isProcess,
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
        this.dataType = dataType;       // typeless, integer, Float, array
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
        clearInterval(this.printInterval)
    }

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


const argv = yargs(hideBin(process.argv))
  .option('username', { type: 'string', describe: 'Username for authentication' })
  .option('password', { type: 'string', describe: 'Password for authentication' })
  .option('port', { type: 'number', default: 8080, describe: 'Port for the server' })
  .option('clientName', { type: 'string', default: 'webClient', describe: 'React client name' })
  .parse()

new SERVER(argv.port, argv.clientName, argv.username, argv.password);