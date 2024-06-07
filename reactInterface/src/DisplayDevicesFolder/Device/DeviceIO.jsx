import React, { useEffect, useState } from 'react';
import Plug from "../../IconComponents/plug"
import Socket from "../../IconComponents/socket"
import Add from "../../IconComponents/Add"
import Cross from '../../IconComponents/Cross';
import Info from "../../IconComponents/Info"
import Label from "../Label"
import Edit from '../../IconComponents/Edit';
import Widget from "../Widget";
import "../DisplayDevicesStyles.css"
import "./Device.css"

const DeviceIO = ({deviceName, inputs, outputs, widgets, sendMapToLinkFactory, addInputCallback,
                   addOutputCallback, statusState, deleteDeviceCallback, requestEditIO, all_inputs, all_outputs}) => {
  const [isInputClicked, setIsInputClicked]     = useState(false);
  const [isOutputClicked, setIsOutputClicked]   = useState(false);
  const [clickedInput, setClickedInput]         = useState("");
  const [clickedOutput, setClickedOutput]       = useState("");
  const [potentialLinkSet, setPotentialLinkSet] = useState(new Map());
  const [showEditIO, setShowEditIO]             = useState(0);
  const [status, setStatus] = useState("offline");

  const [editIOData, setEditIOData] = useState({})


  const validStatuses = ["offline", "online", "alert", "fault", "criticalFault"];

  function inputClicked(clickedInputName) {
    setIsInputClicked(!isInputClicked)
    setClickedInput(clickedInputName)
  }

  function outputClicked(clickedOutputName) {
    setIsOutputClicked(!isOutputClicked)
    setClickedOutput(clickedOutputName)
  }

  function getIOInfo() {
    let ioNAME = clickedInput;
  }

  function addInputToMap() {
    addInputCallback(clickedInput, deviceName)
    setIsInputClicked(!isInputClicked)
  }
  function addOutputToMap() {
    addOutputCallback(clickedOutput, deviceName)
    setIsOutputClicked(!isOutputClicked)
  }

  function removeDevice() {
    deleteDeviceCallback(deviceName)
  }


  function doesWidgetExist(output) {
    if (typeof widgets[output] === 'object' && widgets[output] !== null) {
      return true;
    }
    return false
  }


  useEffect(()=> {
    if (validStatuses.includes(statusState)) {
      setStatus(statusState);
    } else {
      setStatus("offline");
    }
  }, [statusState])


  function editOutput() {
    setShowEditIO(!showEditIO)
    if (showEditIO) {
      requestEditIO(deviceName, clickedOutput, editIOData)
      setEditIOData({})
    }
  }

  return (
    <div className="DeviceIO">
        <div className=" titleDiv deviceTitle  " id='statusTitle' >
            <div className={`statusDiv ${status}`}></div>
            <h3>{deviceName}</h3>
            <Cross onClick={removeDevice} className="cross" width = "1em" height = "1em" color = "#B22222"/>
        </div>

        <div className="columnContainer">
          {showEditIO ?
              <React.Fragment>
                <div className="editIOWindow">
                  {Object.keys(widgets[clickedOutput].widgets).map((key) => {
                      const widget = widgets[clickedOutput].widgets[key];
                      return (
                        <Widget
                          key={key}
                          widgetType={widget.widgetType}
                          widgetName={widget.widgetName}
                          values={widget.values}
                          editIOData={editIOData}
                          setEditIOData={setEditIOData}
                        />
                      )
                    })}
                  <button className="addDeviceButton" onClick={editOutput}>Save and Close</button>
                </div>
              </React.Fragment>
            : 
              <React.Fragment>
                <div className={isInputClicked ? "IOContainer Selected" : "IOContainer"}>
                  {isInputClicked 
                  ?
                  <React.Fragment>
                    <Label Icon={Plug} text = {clickedInput}  onClick={inputClicked} iconStyleClass = {"inputsActive"}/>
                    <Label Icon={Add}  text = {"Add Link"}    onClick={addInputToMap}/>
                    <Label Icon={Info} text = {"Node Info"}   onClick={getIOInfo}/>

                  </React.Fragment>

                  :
                  inputs.map((word, index) => (
                    <Label Icon={Plug} key = {index} text = {word} onClick={inputClicked}/>
                  ))
                  }
              </div>
              <div className={isOutputClicked ? "IOContainer Selected" : "IOContainer"}>
                  {isOutputClicked
                  ?
                  <React.Fragment>
                    <Label Icon={Socket} text = {clickedOutput}  onClick={outputClicked} iconStyleClass = {"outputsActive"}/>
                    <Label Icon={Add}  text = {"Add Link"}       onClick={addOutputToMap}/>
                    {(doesWidgetExist(clickedOutput)) ? <Label Icon={Edit} text = {"Edit"}  onClick={editOutput}/> : null}
                    <Label Icon={Info} text = {"Info"}           onClick={getIOInfo}/>
                  
                  </React.Fragment>
                  :
                  all_outputs.map((word, index) => {
                    if (outputs.includes(word)) {
                      return <Label Icon={Socket}  key = {index} text = {word} onClick={outputClicked}/>
                    } else {
                      return (
                        <div style={{'filter': 'brightness(0.5)', 'cursor' : '!important not-allowed'}}>
                          <Label Icon={Socket}  key = {index} text = {word} style={{'cursor' : '!important not-allowed'}}/>
                        </div>
                      )
                    }
                  })
                  }
              </div>
              </React.Fragment>
          }
        </div>

    </div>
  );
}

export default DeviceIO;


// {outputs.map((word, index) => (
//     <p key={index}>{word}</p>
// ))}