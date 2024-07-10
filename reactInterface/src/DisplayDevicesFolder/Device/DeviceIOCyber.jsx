import React, { useEffect, useState } from 'react';
import Plug from "../../IconComponents/plug"
import Socket from "../../IconComponents/socket"
import Add from "../../IconComponents/Add"
import Cross from '../../IconComponents/Cross';
import Info from "../../IconComponents/Info"
import Label from "../Label"
import Edit from '../../IconComponents/Edit';
// import Widget from "../Widget";
import "../DisplayDevicesStyles.css"
import "./DeviceCyber.css"

const DeviceIO = (props) => {
  const [isInputClicked, setIsInputClicked]     = useState(false);
  const [isOutputClicked, setIsOutputClicked]   = useState(false);
  const [clickedInput, setClickedInput]         = useState("");
  const [clickedOutput, setClickedOutput]       = useState("");
  const [potentialLinkSet, setPotentialLinkSet] = useState(new Map());
  const [showEditIO, setShowEditIO]             = useState(0);
  const [status, setStatus] = useState("offline");
  const [showDeviceInfo, setShowDeviceInfo] = useState(0)
  const [editIOData, setEditIOData] = useState({})
  const [availableEncrypt, setAvailableEncrypt] = useState({})

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
    props.addInputCallback(clickedInput, props.deviceName)
    setIsInputClicked(!isInputClicked)
  }
  function addOutputToMap() {
    props.addOutputCallback(clickedOutput, props.deviceName)
    setIsOutputClicked(!isOutputClicked)
  }

  function removeDevice() {
    props.deleteDeviceCallback(props.deviceName)
  }

  function doesWidgetExist(output) {
    if (typeof props.widgets[output] === 'object' && props.widgets[output] !== null) {
      return true;
    }
    return false
  }

  function editOutput() {
    setShowEditIO(!showEditIO)
    if (showEditIO) {
      props.requestEditIO(props.deviceName, clickedOutput, editIOData)
      setEditIOData({})
    }
  }

  useEffect(()=> {
    if (validStatuses.includes(props.statusState)) {
      setStatus(props.statusState);
    } else {
      setStatus("offline");
    }
  }, [props.statusState])

  useEffect(() => {
    let availableEncryptStandards = {}
    if (typeof props.supportedEncryptionStandards !== 'undefined') {
      for (const [algorithm, value] of Object.entries(props.supportedEncryptionStandards)) {
        if (props.supportedEncryptionStandards[algorithm].keys) {
          availableEncryptStandards[algorithm] = Object.keys(props.supportedEncryptionStandards[algorithm].keys).toString()
        } else {
          availableEncryptStandards[algorithm] = "NO KEY INFO"

        }
      }
    }
    setAvailableEncrypt(availableEncryptStandards)

  }, [props.supportedEncryptionStandards])


  
  

  return (
    <div className="DeviceIOCyberContainer">
      <div className="deviceInfoContainer" onClick={() => (setShowDeviceInfo(!showDeviceInfo))}>
          <Info height="1em" viewBox="0 0 47 20" color="black" />
      </div>
      <div className="DeviceIOCyber">
          <div className="deviceTitle ">
              <div className={`statusDiv ${status}`}></div>
              <h3>{props.deviceName}</h3>
              <Cross onClick={removeDevice} className="cross" width = "1em" height = "1em" color = "#B22222"/>
          </div>
          {showDeviceInfo ? 
          <div className="DeviceInfoWindow">
            <h3>ENCRYPTION STANDARDS: </h3> 

            {Object.entries(availableEncrypt).map(([key, value]) => (
              <li key={key}>
                {key}  {"=>"} {value}
              </li>
            ))}

            <p>Connected Devices:</p>
            <ul>
              {Object.entries(props.connectedTo).map(([key, value]) => (
                <li key={key}>
                  {key}  {"=>"} {value}
                </li>
              ))}
            </ul>
            <p>Device Info: {props.deviceInfo}</p>
          </div>
          : 
          <div className="columnContainer">
            {showEditIO ?
                <React.Fragment>
                  <div className="editIOWindow">
                    {Object.keys(props.widgets[clickedOutput].props.widgets).map((key) => {
                        const widget = props.widgets[clickedOutput].props.widgets[key];
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
                    props.all_inputs.map((word, index) => {
                      if (props.inputs.includes(word)) {
                        return <Label Icon={Plug}  key = {index} text = {word} onClick={inputClicked}/>
                      } else {
                        return (
                          <div style={{'filter': 'brightness(0.5)', 'cursor' : 'not-allowed'}}>
                            <Label Icon={Plug}  key = {index} text = {word} style={{'cursor' : 'not-allowed'}}/>
                          </div>
                        )
                      }
                    })
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
                    props.all_outputs.map((word, index) => {
                        if (props.outputs.includes(word)) {
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
          }

      </div>
    </div>
  );
}

export default DeviceIO;


// {props.outputs.map((word, index) => (
//     <p key={index}>{word}</p>
// ))}