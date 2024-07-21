import React, { useEffect, useState } from 'react';
import DeviceIO from "./Device/DeviceIO"
import DeviceIOCyber from "./Device/DeviceIOCyber"
import Down from "../IconComponents/Down"
import Up from "../IconComponents/Up"
import RectangleDiv from "../rectangleDiv"
import AddWithNoOutline from "../IconComponents/AddWithNoOutline"
import CreateFakeDevice from "./CreateFakeDevice"
import "./DisplayDevicesStyles.css"
import TokenCyber from '../IconComponents/TokenCyber.jsx';

const DisplayDeviceIO = (props) => {
  const [potentialLinkSet, setPotentialLinkSet] = useState(new Map());
  const [showDeviceCreation,setShowDeviceCreation] = useState(0);
  const [isCyber, setIsCyber] = useState(0)

  function addFakeDevice() {
    setShowDeviceCreation(!showDeviceCreation)
  }

  function addInputToMap(clickedInput, deviceName) {
    let ioNAME = clickedInput;
    setPotentialLinkSet(prevState => {
      const updatedMap = new Map(prevState);
      updatedMap.set("input", {'input': ioNAME, 'deviceName': deviceName});
      return updatedMap;
    });
  }

  function addOutputToMap(clickedOutput, deviceName) {
    let ioNAME = clickedOutput;
    setPotentialLinkSet(prevState => {
      const updatedMap = new Map(prevState);
      updatedMap.set("output", {'input': ioNAME, 'deviceName': deviceName});
      return updatedMap;
    });
  }

  function linkManage() {
    if (potentialLinkSet.has("input") && potentialLinkSet.has("output")) {
      let inputIO  = potentialLinkSet.get("input")
      let outputIO = potentialLinkSet.get("output")
      props.sendMapToLinkFactory(potentialLinkSet)
      potentialLinkSet.delete("input")
      potentialLinkSet.delete("output")
    }
  }

  useEffect(() => {
      linkManage()
  }, [potentialLinkSet]);

  return (
    <RectangleDiv
      menuName={"Device IO"}
      rightItemList={[<div className='resizeArrowContainer' onClick={addFakeDevice}><AddWithNoOutline/></div>, 
                      <div className='resizeArrowContainer' onClick={() => {setIsCyber(!isCyber)}} ><TokenCyber width = {'1.2rem'}/></div>]}

      MenuItem={
          showDeviceCreation ? (
            <CreateFakeDevice setShowDeviceCreation = {setShowDeviceCreation} createNewDevice = {props.createNewDevice}/>
          ) :   
          <div className={"deviceIOGrid"}>
            {Object.keys(props.availableIO).map((ioName) => {
              if (isCyber) {
                return <DeviceIOCyber
                    deviceName={ioName}
                    key = {ioName}
                    inputs={props.availableIO[ioName].inputs}
                    outputs={props.availableIO[ioName].outputs}
                    all_inputs ={props.availableIO[ioName].all_inputs}
                    all_outputs ={props.availableIO[ioName].all_outputs}
                    widgets = {props.availableIO[ioName].widgets}
                    sendMapToLinkFactory={props.sendMapToLinkFactory}
                    addInputCallback={addInputToMap}
                    addOutputCallback={addOutputToMap}
                    requestEditIO  = {props.requestEditIO}
                    deleteDeviceCallback = {props.deleteDeviceCallback}
                    statusState={props.availableIO[ioName].statusState}
                    connectedTo={props.availableIO[ioName].connectedTo}
                    deviceInfo={props.availableIO[ioName].deviceInfo}
                    supportedEncryptionStandards = {props.availableIO[ioName].supportedEncryptionStandards}
                />
              } else {
                return <DeviceIO
                    deviceName={ioName}
                    key = {ioName}
                    inputs={props.availableIO[ioName].inputs}
                    outputs={props.availableIO[ioName].outputs}
                    widgets = {props.availableIO[ioName].widgets}
                    sendMapToLinkFactory={props.sendMapToLinkFactory}
                    addInputCallback={addInputToMap}
                    addOutputCallback={addOutputToMap}
                    requestEditIO  = {props.requestEditIO}
                    deleteDeviceCallback = {props.deleteDeviceCallback}
                    statusState={props.availableIO[ioName].statusState}
                    connectedTo={props.availableIO[ioName].connectedTo}
                    all_inputs ={props.availableIO[ioName].all_inputs}
                    all_outputs ={props.availableIO[ioName].all_outputs}
                />
              }
            })}
        </div>
        }
      isExpanded = {props.isExpanded}
    />
  );
}

export default DisplayDeviceIO;
