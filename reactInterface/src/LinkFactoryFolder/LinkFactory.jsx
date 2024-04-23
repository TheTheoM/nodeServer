import React, { useEffect, useRef, useState } from 'react';
import RequestLink from "./RequestLink";
import Down from "../IconComponents/Down"
import Up from "../IconComponents/Up"
import RectangleDiv from "../rectangleDiv"
import "./linkFactoryStyles.css"



const LinkFactory = ({linkFactoryMap, requestLinkCallback, requestPersistentLinkCallback}) => {
    const [potentialLinkMap, setPotentialLinkMap] = useState(new Map());
    const [inputDeviceName, setinputDeviceName] = useState();
    const [inputName, setinputName] = useState();
    const [outputDeviceName, setoutputDeviceName] = useState();
    const [outputName, setoutputName] = useState();

  useEffect(() => {
    if (linkFactoryMap.size == 2) {
        let inputDeviceName  = linkFactoryMap.get("input").deviceName
        let inputName        = linkFactoryMap.get("input").input
        let outputDeviceName = linkFactoryMap.get("output").deviceName
        let outputName       = linkFactoryMap.get("output").input
        
        let name = outputDeviceName + outputName + inputDeviceName + inputName
        let data = {
            linkName:         name,
            outputDevice:     outputDeviceName,
            outputName:       outputName,
            inputDeviceName:  inputDeviceName,
            inputName:        inputName,
        }
        setPotentialLinkMap(prevMap => new Map(prevMap).set(name, data));
    }
  }, [linkFactoryMap])

  function rejectLink(outputDeviceName, outputName, inputDeviceName, inputName) {
    let linkName = outputDeviceName + outputName + inputDeviceName + inputName;
    potentialLinkMap.delete(linkName); 
    setPotentialLinkMap(potentialLinkMap); 
  }

  function acceptLink(outputDeviceName, outputName, inputDeviceName, inputName) {
    let linkName = outputDeviceName + outputName + inputDeviceName + inputName;
    potentialLinkMap.delete(linkName); 
    setPotentialLinkMap(potentialLinkMap);
    requestLinkCallback(outputDeviceName, outputName, inputDeviceName, inputName)
  }


  function acceptPersistentLink(outputDeviceName, outputName, inputDeviceName, inputName) {
    let linkName = outputDeviceName + outputName + inputDeviceName + inputName;
    potentialLinkMap.delete(linkName); 
    setPotentialLinkMap(potentialLinkMap);
    requestPersistentLinkCallback(outputDeviceName, outputName, inputDeviceName, inputName)
  }


  return (
    <RectangleDiv 
      menuName={"Link Factory"}
      MenuItem={
        <div className="LinkFactory">
          {Array.from(potentialLinkMap).map(([key, value]) => (
            <RequestLink
              linkName= {value.linkName}
              outputDevice = {value.outputDevice}
              outputName = {value.outputName}
              inputDeviceName = {value.inputDeviceName}
              inputName = {value.inputName}
              rejectLinkCallback = {rejectLink}
              acceptLinkCallback = {acceptLink}
              acceptPersistentLinkCallback = {acceptPersistentLink}
            />
          ))}
        </div>
      }
      isExpanded = {true}
    />
  );
}

export default LinkFactory;
