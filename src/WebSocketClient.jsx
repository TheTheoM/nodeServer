import React, { useEffect, useState, useRef } from 'react';
import DisplayDevices from './DisplayDevicesFolder/DisplayDevices.jsx'
import LinkFactory from "./LinkFactoryFolder/LinkFactory.jsx"
import RectangleDiv from "./rectangleDiv"
import NodeFactory from "./NodeFactoryFolder/NodeFactory.jsx"
import LoggingPanel from './LoggingPanel/LoggingPanel.jsx';
import Plug from "./IconComponents/Add"
import DataLinks from './DataLinksFolder/DataLinks.jsx';
import ManagePersistentLinks from './ManagePersistentLinks/ManagePersistentLinks.jsx';
////
import { createContext } from 'react';
////
let isConnected = false
let deviceName = "webClient"



const WebSocketClient = () => {
  const [isWebSocketClosed, setIsWebSocketClosed] = useState("closed")
  const [linkFactoryMap, setLinkFactoryMap] = useState({})
  const reconnectionInterval = useRef()
  const ws_url = "ws://192.168.1.123:8080"
  const webSocket = useRef(null)

  const [contextValue, setContextValue] = useState({
    'persistentLinks': {},
    'activeLinks' : {},
    'availableIO':  {},
    'deviceLogs':   [],
  })

  //
  useEffect(() => {
      if (isWebSocketClosed === "closed") {
        reconnectionInterval.current = (setInterval(connectToWebsocket(this), 3000))
      }
  }, [isWebSocketClosed])


  function toServer(message) {
      if (webSocket.current) {
        webSocket.current.send((message))
      }
  }
  

  function connectToWebsocket(context) {
    console.log("Connecting ...")
    webSocket.current = new WebSocket(ws_url)

    webSocket.current.onopen = (event) => {
      console.log("Connected.")
        setIsWebSocketClosed("open")
        clearInterval(reconnectionInterval.current)
        const messageData = {
          type: "registerDevice",
          name: deviceName,
          isNode: false,
          inputNames: ["null"],
          outputNames: ["null"],
          deviceInfo: "React Info",
        };
        (webSocket.current.send(JSON.stringify(messageData)))
        ////////////////////////////////////
        setInterval(() => {
          toServer(JSON.stringify({
            type: "requestAvailableIO"
          }))
        }, 400) 
        ////////////////////////////////////
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
            break;

          case ('linkMapUpdate'):
            setContextValue((context) => ({...context, activeLinks: data.activeLinks}))
            break;

          case 'linkInspectData':
            let linkName = data.linkName;
            let lastMsg = data.data;
            
            setContextValue((context) => {
              const updatedLinks = { ...context.activeLinks };
              const linkToUpdate = updatedLinks[linkName];
              const updatedLink = { ...linkToUpdate, lastMessage: lastMsg };
              updatedLinks[linkName] = updatedLink;
              return {...context, activeLinks: updatedLinks}
            })

            break;

          case 'availableIO':
            setContextValue((context) => {
              return {...context, availableIO: data.availableIO}
            })
            break;

          case 'getLogs':
            setContextValue((context) => {
              return {...context, deviceLogs: data.deviceLogs}
            })
            break;


          case 'persistentLinksUpdate':
            console.log(data)
            setContextValue((context) => {
              return {...context, persistentLinks: data.persistentLinks}
            })
            break
            
            

        }
        
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }

    webSocket.current.onclose = function (event) {
      setTimeout(() => {
        console.log("Disconnected. ")
        setContextValue((context) => {
          return {...context, activeLinks: {}}
        })
        setIsWebSocketClosed("closed")
      }, 1000);
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

  function deleteDeviceCallback(deviceName) {
    toServer(JSON.stringify({
      type: "removeDeviceByName",
      deviceName: deviceName,
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
    if (true) {
      toServer(JSON.stringify({
        type: "modifyLogFilters",
        filters: filters
      }))
    }
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

  function updatePersLink(linkName, outputDevice, outputName, inputDevice, inputName, encrypt_algorithm, key_Length, prefer_Highest_Key, isHybrid) {
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


  return (
      <> 
        <NodeFactory    availableIO = {contextValue.availableIO}  activeLinks={contextValue.activeLinks}
                        requestEditIO = {requestEditIO}           sendNodePositions = {sendNodePositions}
                        breakLink_By_LinkName = {breakLink_By_LinkName} requestLinkDataInspect = {requestLinkDataInspect}
                        requestPersistentLink = {requestPersistentLink} breakPersistentLink = {breakPersistentLink}
                        Server_BreakPermanentLink = {Server_BreakPermanentLink}
                        isExpanded = {true}/>

        <DataLinks      activeLinks={contextValue.activeLinks} breakLink_By_LinkName = {breakLink_By_LinkName}
                        requestLinkDataInspect = {requestLinkDataInspect} Server_BreakPermanentLink = {Server_BreakPermanentLink}
                        isExpanded = {true}/>

        <ManagePersistentLinks  persistentLinks = {contextValue.persistentLinks} Server_BreakPermanentLink  = {Server_BreakPermanentLink}
                                availableIO = {contextValue.availableIO} updatePersLink = {updatePersLink}
                                activeLinks={contextValue.activeLinks}
                                isExpanded = {false}/>

        <DisplayDevices availableIO = {contextValue.availableIO} sendMapToLinkFactory = {sendMapToLinkFactory}
                        createNewDevice = {createNewDevice} deleteDeviceCallback = {deleteDeviceCallback}
                        requestEditIO = {requestEditIO}
                        isExpanded = {false}/>

        <LinkFactory    linkFactoryMap={linkFactoryMap} requestLinkCallback={requestLink}
                        requestPersistentLinkCallback = {requestPersistentLinkCallback}
                        isExpanded = {false}/>

        <LoggingPanel   deviceLogs = {contextValue.deviceLogs} availableIO = {contextValue.availableIO}
                         filterLogsCallback = {filterLogsCallback}
                         isExpanded = {true}/>
      </>
  );
};

export default WebSocketClient;
