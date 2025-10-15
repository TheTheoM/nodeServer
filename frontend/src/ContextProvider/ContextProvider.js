import React, { useEffect, useState, useRef, createContext } from 'react';

let isConnected = false
let authorization_token = null;
let deviceName = "webClient-newGUI"

export const MyContext = createContext();

export const ContextProvider = ({children}) => {
    const [isWebSocketOpen, setIsWebSocketOpen] = useState(false)
    const [linkFactoryMap, setLinkFactoryMap] = useState({})
    const reconnectionInterval = useRef()
    const ws_url = `ws://${process.env.REACT_APP_WEBSOCKET_SERVER_IP}`
    const webSocket = useRef(null)
    const requestAvailableIOInterval = useRef(null)

    const [context, setContext] = useState({
        "isWebSocketOpen": isWebSocketOpen,
        'persistentLinks': {},
        'linkFunctions': {
            'requestPersistentLink':      requestPersistentLink,
            'breakPersistentLink':        breakPersistentLink,
            'Server_BreakPermanentLink':  Server_BreakPermanentLink,
            'updatePersistentLink':       updatePersistentLink,
            'breakLink_By_LinkName':      breakLink_By_LinkName,
            'requestLinkDataInspect':     requestLinkDataInspect,
            'requestLink':                requestLink,
        },
        'nodes': {
          'sendNodePositions': sendNodePositions,
          'requestEditIO': requestEditIO,
        },
        'activeLinks' :    {},
        'availableIO':     {},
        'deviceLogs':      [],
        'deviceLogsFunctions': {
            'filterLogsCallback': filterLogsCallback,
        },
        'processes':       {},
        'processFunctions': {
          'addProcess':     addProcess,
          'startProcess':   startProcess,
          'killProcess':    killProcess,
          'restartProcess': restartProcess,
          'removeProcess':  removeProcess,
          'editProcess':    editProcess,
        },
        'serverData': {
          "CPU": {
            "current_Usage": -1,
            "data": [],
          },
          "RAM": {
            "current_Usage": 100,
            "data": [10, 30, 30],
            "total_RAM": '16 GB',
            "RAM_Usage": '8 GB',
          },
          "NETWORK": {
            "current_Usage": 100,
            "data": [],
            "current_Traffic": "-1 Mbps", // (This is not coded yet, server-side)
          },
          "STORAGE": {
            "total_Storage": "1024 GB",
            "current_Usage": "513 GB"
          },
          "dashboardNotification": {
            'message': null,
            'notificationType': 'info' // info, alert, warning, error
          },
        },
        "deviceFunctions":  {
          "disconnectDevice":  disconnectDevice,
          "banDevice":         banDevice,
          "pingDevice":        pingDevice,
        },
        "authorization": {
           "authorizationState" : "readOnlyViewer",
           'handleViewOnly':      handleViewOnly,
           "sendCredentials":     sendCredentials,
        },
        "user" : {
          "username": "",
          "Logout": handleLogout,
        }
    })

    useEffect(() => {
      authorization_token = localStorage.getItem('authToken');
      if (authorization_token) {
        setContext(prevContext => ({
          ...prevContext,
          authorization: {
            ...prevContext.authorization,
            authorizationState: "authenticated"
          }
        }))
      }
    }, []);

    function handleLogout() {
      localStorage.removeItem('authToken');
      setContext(prevContext => ({
        ...prevContext,
        authorization: {
          ...prevContext.authorization,
          authorizationState: "unauthorized"
        }
      }))
    }
    
    useEffect(() => {
        if (!isWebSocketOpen) {
          reconnectionInterval.current = (setInterval(connectToWebsocket(this), 3000))
        } else {
          clearInterval(reconnectionInterval.current)
        }
        setContext((context) => ({...context, isWebSocketOpen: isWebSocketOpen}))

    }, [isWebSocketOpen])
  
  
    function toServer(message) {
        if ((webSocket.current)  && webSocket.current.readyState === WebSocket.OPEN) {
          webSocket.current.send((message))
        } else {
          console.log("Cannot send due to websocket not being ready. Message: " + JSON.stringify(message))
          setIsWebSocketOpen(false)
        }
    }
    
   
    function connectToWebsocket(context) {
      console.log("Connecting ...")
      webSocket.current = new WebSocket(ws_url)
      webSocket.current.onopen = (event) => {
          console.log("Connected.")
          setIsWebSocketOpen(true)

          const registrationMessage = {
            type: "registerDevice",
            name: deviceName,
            isNode: false,
            inputNames: ["null"],
            outputNames: ["null"],
            deviceInfo: "React Info",
          };

          setTimeout(() => {
            toServer(JSON.stringify(registrationMessage))

            requestAvailableIOInterval.current = setInterval(() => {
              toServer(JSON.stringify({
                type: "requestAvailableIO"
              }))
            }, 500) 
          }, 300)

          // The timeout is to ensure the socket is open to avoid "not open errors"

      };
  
      webSocket.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // console.log(data)
          switch (data.type) {
            case ("nameTaken"):
              deviceName = data.proposedName
              const messageData = {
                type: "registerDevice",
                name: deviceName,
                isNode: false,
                inputNames: ["null"],
                outputNames: ["null"],
                deviceInfo: "React Info",
              };
              (webSocket.current.send(JSON.stringify(messageData)))
              break;
  
            case ("connected"):
              isConnected = true
              if (authorization_token) {
                toServer(JSON.stringify({
                  "type" : "sendAuthToken",
                  "token": authorization_token
                }))
              }

              break;
  
            case ('linkMapUpdate'):
              setContext((context) => ({...context, activeLinks: data.activeLinks}))
              break;
  
            case 'linkInspectData': 
              let linkName = data.linkName;
              let lastMsg = data.data;
              // console.log(lastMsg)
              setContext((context) => {
                const updatedLinks = { ...context.activeLinks };
                const linkToUpdate = updatedLinks[linkName];
                const updatedLink = { ...linkToUpdate, lastMessage: lastMsg };
                updatedLinks[linkName] = updatedLink;
                return {...context, activeLinks: updatedLinks}
              })
  
              break;

            case 'availableIO':
              setContext((context) => {
                if (context.availableIO !== data.availableIO) {
                  return { ...context, availableIO: data.availableIO };
                }
                return context;
              });
              break;
  
            case 'getLogs':
              setContext((context) => {
                return {...context, deviceLogs: data.deviceLogs}
              })
              break;
  
            case 'persistentLinksUpdate':
              setContext((context) => {
                return {...context, persistentLinks: data.persistentLinks}
              })
              break
              
            case "getAllProcesses":
              setContext((context) => {
                return {...context, processes: data.processes}
              })
              break
              
            case "getAllProcessResources":
              setContext((context) => {
                let existingProcessesData = context.processes
                
                for (let [processName, process] of Object.entries(existingProcessesData)) {
                  let resourceData = data.processes[processName]
                  if (resourceData) {
                    process = {...process, ...resourceData}
                    existingProcessesData[processName] = process
                  }
                }

                return {...context, processes: existingProcessesData}
              })
              break

            case "computerPerformanceData":
              let computerPerformanceData = data.computerPerformanceData;
              setContext((context) => {
                  const {
                      totalMemory,
                      usedMemory,
                      freeMemory,
                      memUsagePercentage,
                      totalStorage,
                      freeStorage,
                      usedStorage,
                      diskUsagePercentage,
                      cpuUsagePercentage
                  } = computerPerformanceData;

                  let serverDataLocal = { ...context.serverData };

                  serverDataLocal.CPU.current_Usage = cpuUsagePercentage;
                  serverDataLocal.CPU.data.push(cpuUsagePercentage);
                  serverDataLocal.CPU.data = serverDataLocal.CPU.data.slice(-100);

                  serverDataLocal.RAM.RAM_Usage = `${usedMemory} GB`;
                  serverDataLocal.RAM.current_Usage = memUsagePercentage;
                  serverDataLocal.RAM.total_RAM = `${totalMemory} GB`;
                  serverDataLocal.RAM.data.push(memUsagePercentage);
                  serverDataLocal.RAM.data = serverDataLocal.RAM.data.slice(-100);

                  serverDataLocal.STORAGE.total_Storage = `${totalStorage} GB`;
                  serverDataLocal.STORAGE.current_Usage = `${usedStorage} GB`;

                  return { ...context, serverData: serverDataLocal };
              })
              break

            case "dashboardNotification":
              setContext(prevContext => ({
                  ...prevContext,
                  serverData: {
                      ...prevContext.serverData,
                      dashboardNotification: {'message': data.dashboardNotification, "notificationType": data.notificationType},
                  }
              }));
              break;

            case "credentialsAuthorization":
              setContext(prevContext => ({
                ...prevContext,
                authorization: {
                  ...prevContext.authorization,
                  authorizationState: data.authorizationState,
                  token: data.token
                }
              }))

              if (data.token) {
                localStorage.setItem('authToken', data.token);  
              }
              break;

              
            case "tokenAuthorization":
              setContext(prevContext => ({
                ...prevContext,
                authorization: {
                  ...prevContext.authorization,
                  authorizationState: data.authorizationState,
                },
                user: {
                  ...prevContext.user,
                  username: data.username
                },

              }))

              break;
          }
          
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      }
  
      webSocket.current.onclose = function (event) {
        console.log("Disconnected. ")
        setContext((context) => {
          return {...context, activeLinks: {}}
        })
        setIsWebSocketOpen(false)
      }

      webSocket.current.onerror = function (event) {
        setIsWebSocketOpen(false)
      }

    }
  
    function sendMapToLinkFactory(map) {
      setLinkFactoryMap(new Map(map));  
    }
  
    function createNewDevice(name, inputs, outputs) {
      toServer(JSON.stringify({
        type: "createVirtualDevice",
        name: name,
        inputs: inputs.current,
        outputs: outputs.current,
      }))
  
    }

  
    function requestLink(outputDeviceName, outputName, inputDeviceName, inputName) {
      toServer(JSON.stringify({
        type: "requestLink",
        outputDeviceName:   outputDeviceName,
        outputName:         outputName,
        inputDeviceName:    inputDeviceName,
        inputName:          inputName,
      }))
    }
  
    function requestPersistentLinkCallback(outputDeviceName, outputName, inputDeviceName, inputName) {
      toServer(JSON.stringify({
        type: "requestPersistentLink",
        outputDeviceName:   outputDeviceName,
        outputName:         outputName,
        inputDeviceName:    inputDeviceName,
        inputName:          inputName,
        requestedByDashboard: true,
      }))
    }
  
    function requestEditIO(deviceName, clickedOutput, data) {
      toServer(JSON.stringify({
        type: "requestEditIO",
        device: deviceName,
        ioName: clickedOutput,
        editIOData: data,
      }))
    }
  
    function filterLogsCallback(filters) {
        toServer(JSON.stringify({
          type: "modifyLogFilters",
          filters: filters
        }))
    }
  
    function sendNodePositions(nodePositions) {
      toServer(JSON.stringify({
        type: "sendNodePositions",
        nodePositions: nodePositions
      }))
    }
  
    function requestPersistentLink(source, sourceHandle, target, targetHandle) {
      toServer(JSON.stringify({
        type: "requestPersistentLink",
        outputDeviceName:  source,
        outputName:        sourceHandle,
        inputDeviceName:   target,
        inputName:         targetHandle,
      }));
    }
  
    function breakPersistentLink(outputDevice, outputName, inputDevice, inputName) {
      toServer(JSON.stringify({
        type: "breakPersistentLink",
        outputDeviceName:  outputDevice,
        outputName:        outputName,
        inputDeviceName:   inputDevice,
        inputName:         inputName,
      }))
    }
    function breakLink_By_LinkName(linkName) {
      toServer(JSON.stringify({
        type: "breakLink_By_LinkName",
        linkName: linkName,
      }))
    }
    
    function requestLinkDataInspect(linkName) {
        toServer(JSON.stringify({
          type: "requestLinkDataInspect",
          "linkName": linkName,
        }))
    }
  
    function Server_BreakPermanentLink(outputDevice, outputName, inputDevice, inputName) {
      toServer(JSON.stringify({
        type: "breakPersistentLink",
        "outputDeviceName":  outputDevice,
        "outputName":        outputName,
        "inputDeviceName":   inputDevice,
        "inputName":         inputName,
      }))
    }
  
    function updatePersistentLink(linkName, outputDevice, outputName, inputDevice, inputName, encrypt_algorithm, key_Length, prefer_Highest_Key, isHybrid) {
      toServer(JSON.stringify({
        type: "updatePersistentLink",
        'linkName':            linkName,
        "outputDeviceName":    outputDevice,
        "outputName":          outputName,
        "inputDeviceName":     inputDevice,
        "inputName":           inputName,
        "encrypt_algorithm":   encrypt_algorithm,
        "key_Length":          key_Length,
        "prefer_Highest_Key":  prefer_Highest_Key,
        'isHybrid':            isHybrid,
      }))
    }
  
    function addProcess(name, runtime, path, restart_on_error, max_restart_count, startup) {
      toServer(JSON.stringify({
        'type':              "addProcess",
        'name':              name,
        'path':              path,
        'runTime':           runtime,
        'restart_on_error':  restart_on_error,
        'max_restart_count': max_restart_count,
        'startup': startup,
      }))
    }
      
    function startProcess(name) {
      toServer(JSON.stringify({
        'type':              "startProcess",
        'name':              name,
      }))
    }

    function editProcess(name, runtime, path, restart_on_error, max_restart_count, startup) {
      toServer(JSON.stringify({
        'type':              "editProcess",
        'name':              name,
        'path':              path,
        'runTime':           runtime,
        'restart_on_error':  restart_on_error,
        'max_restart_count': max_restart_count,
        'startup': startup,
      }))
    }
    
    function killProcess(name) {
      toServer(JSON.stringify({
        'type':             "killProcess",
        'name':             name,
      }))
    }

    function restartProcess(name) {
      toServer(JSON.stringify({
        'type':             "restartProcess",
        'name':             name,
      }))
    }
  
    function removeProcess(name) {
      toServer(JSON.stringify({
        'type':             "removeProcess",
        'name':             name,
      }))
    }

  
    function disconnectDevice(deviceName) {
      toServer(JSON.stringify({
        type: "removeDeviceByName",
        deviceName: deviceName,
      }))
    }


    function banDevice(deviceName) {
      toServer(JSON.stringify({
        'type': "banDevice",
        deviceName: deviceName
      }))
    }

    function pingDevice(deviceName) {
      toServer(JSON.stringify({
        'type': "pingDevice",
        deviceName: deviceName
      }))
    }

    function sendCredentials(username, password) {
      // CAUTION | UNENCRYPTED | CHANGE 

      setContext(prevContext => ({
        ...prevContext,
        user: {
          ...prevContext.user,
          username: username
        }
      }))

      toServer(JSON.stringify({
        'type': "sendCredentials",
        username: username,
        password: password,
      }))
    }

    function handleViewOnly() {
      setContext(prevContext => ({
        ...prevContext,
        authorization: {
          ...prevContext.authorization,
          authorizationState: "viewOnly"
        }
      }));
    };
   
    return (
        <MyContext.Provider value={{context, setContext}}>
            {children}
        </MyContext.Provider>
);
}