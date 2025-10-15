import React, { useState, useContext} from 'react';
import Down from '../../../IconComponents/Down';
import './Device.css'
import { MyContext } from '../../../ContextProvider/ContextProvider';

function Device({ name, inputs, outputs, all_inputs, all_outputs, widgets, deviceInfo, nodePosition, isNode, connectedTo, statusState, isdevice }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [runtime, setRuntime] = useState("initialRuntime");
    const [restartOnError, setRestartOnError] = useState("initialRestartOnError");
    const [restartDelay, setRestartDelay] = useState("initialRestartDelay");
    const [path, setPath] = useState("initialPath");

    const handleEdit = () => setIsEditing(true);
    const handleSubmit = () => setIsEditing(false);
    const handleCancel = () => setIsEditing(false)

    const { context } = useContext(MyContext);


    function toggleExpand() {
        setIsExpanded(!isExpanded)
        // onExpanded(!isExpanded, id)
    }

    return (
        <div className={"device " + (isExpanded ? "expanded" : "")} id = {name}>
            <div className={'device-top-bar ' + (isExpanded ? "expanded-top-bar" : "")}>
                <p className='device-name'>{name}</p>
                    <Down 
                        style={{cursor: "pointer", transform: (isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'), marginTop: (isExpanded ? '-3px' : '8px')}} 
                        onClick={toggleExpand} 
                    />
            </div>

            <div style={{ display: isExpanded ? "flex" : "none" }} className='device-content'>
                <div className="left-box">
                    <div className="field">
                        <label htmlFor="inputs">Inputs:</label>
                            <ul className='IOBox'>
                                {inputs && Object.keys(inputs).length > 0 ? (
                                    Object.keys(inputs).map((inputName) => (
                                        <li key={inputName}>{inputName}</li>
                                    ))
                                ) : (
                                    <li>null</li>
                                )}
                            </ul>
                    </div>
                    <div className="field">
                        <label htmlFor="outputs">Outputs: </label>
                            <ul className='IOBox'>
                                {outputs && Object.keys(outputs).length > 0 ? (
                                        Object.keys(outputs).map((outputName) => (
                                            <li key={outputName}>{outputName}</li>
                                        ))
                                    ) : (
                                        <li>null</li>
                                    )}
                            </ul>
                    </div>
                    <div className="field">
                        <>Status:</>
                        <label htmlFor="statusState">{statusState}</label>
                    </div>
                    <div className="field">
                        <>Device Info:</>
                        <label htmlFor="deviceInfo">{deviceInfo}</label>
                    </div>
                  </div>
                <div className="right-box">
                    <h3>Controls:</h3>
                    <div className="buttons">
                        <div><button onClick={() => {context.deviceFunctions.disconnectDevice(name)}}>Disconnect</button></div>
                        <div><button onClick={() => {context.deviceFunctions.banDevice(name)}}>Ban</button></div>
                        <div><button onClick={() => {context.deviceFunctions.pingDevice(name)}}>Ping</button></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Device;
