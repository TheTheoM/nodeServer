import React, { useState, useRef } from 'react';
import AddWithNoOutline from "../IconComponents/AddWithNoOutline.jsx";
import BreakLink from "../IconComponents/BreakLink.jsx";
import DisconnectLink from "../IconComponents/DisconnectLink.jsx";
import Down from "../IconComponents/Down.jsx";
import Info from "../IconComponents/Info.jsx";
import Inspect from "../IconComponents/Inspect.jsx";
import Plug from "../IconComponents/plug.jsx";
import Socket from "../IconComponents/socket.jsx";
import Up from "../IconComponents/Up.jsx";
import InputText    from './addDeviceIOComponents/InputText';
import RandomNumber from './addDeviceIOComponents/RandomNumber';
import LoopToOutput from './addDeviceIOComponents/LoopToOutput';
import RGBCreator   from './addDeviceIOComponents/RGBCreator';

import "./DisplayDevicesStyles.css"

export default function CreateFakeDevice(props) {
    const inputRef = useRef(null)
    const inputs  = useRef({});
    const outputs = useRef({});
  
    function addDevice() {
        
        if (inputRef.current.value.length > 0) {
            props.createNewDevice(inputRef.current.value, inputs, outputs)
            props.setShowDeviceCreation(false)
            inputRef.current.style.boxShadow = "";

        } else {
            console.log("runs")
            inputRef.current.style.boxShadow = "0 0 5px red";

        }
    }
    function addInput(inputData) {
        inputs.current[inputData.name]   = inputData
        console.log(inputs)

    }

    function addOutput(outputData) {
        outputs.current[outputData.name] = outputData
        console.log(outputs)
    }


  return (
    <div className='CreateFakeDevice'>
   
        <div className="addDeviceContainer">
            <div className="addDeviceNameContainer">
                <div className="deviceNameBoxContainer">
                    <div className="inputBox ">
                        <input
                            type="text"
                            placeholder='Device name'
                            ref = {inputRef}
                        />
                    </div>
                    <button className='addDeviceButton' onClick={addDevice}>Add Device</button>
                </div>
            </div>
            <div className="addInputContainer"> 
                <div className="addInputBox">
                    <div className="addDeviceIOTitle">
                        <h3>Inputs:</h3>
                    </div>
                    <div className='IOBox'>
                            <LoopToOutput className = "IOIcons" addInput = {addInput}/>
                            {/* <RandomNumber /> */}
                    </div>
                </div>
       
            </div>
            <div className="addOutputContainer">
                <div className="addOutputBox">
                    <div className="addDeviceIOTitle">
                        <h3>Outputs:</h3>
                    </div>
                    <div className='IOBox'>
                            <InputText     addOutput = {addOutput}/>
                            <RandomNumber  addOutput = {addOutput}/>
                            <RGBCreator    addOutput = {addOutput}/>
                            
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

