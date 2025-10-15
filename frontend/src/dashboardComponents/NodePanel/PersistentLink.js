import React, { useState, useRef, useContext, useEffect } from 'react';
import Down from "../../IconComponents/Down";
import './PersistentLinksWindow.css'; 
import { MyContext } from '../../ContextProvider/ContextProvider';
import Info from '../../IconComponents/Info.jsx';

function PersistentLink({initialOutputDevice, initialOutputName, initialInputDevice, initialInputName, name, onExpanded, isActive, ID}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing]   = useState(false);
    const [outputDevice, setOutputDevice] = useState(initialOutputDevice);
    const [outputName, setOutputName]     = useState(initialOutputName);
    const [inputDevice, setInputDevice]   = useState(initialInputDevice);
    const [inputName, setInputName]       = useState(initialInputName);

    const handleEdit = () => setIsEditing(true);
    const handleSubmit = () => setIsEditing(false);
    const handleCancel = () => setIsEditing(false)

    const { context } = useContext(MyContext);

    function toggleExpand() {
        setIsExpanded(!isExpanded)
        onExpanded(!isExpanded, ID)
    }

    function breakLink_By_LinkName() {
        context.linkFunctions.breakLink_By_LinkName(name)
    }
    function breakPersistentLink() {
        toggleExpand()
        context.linkFunctions.breakPersistentLink(outputDevice, outputName, inputDevice, inputName)
    }

    function requestLink() {
        context.linkFunctions.requestLink(outputDevice, outputName, inputDevice, inputName)
    }

    return (
        <div className={"PersistentLink " + (isExpanded ? "expanded" : "")} id = {ID}>
            <div className={'PersistentLink-top-bar ' + (isExpanded ? "expanded-top-bar" : "")}>
                <p className='PersistentLink-name'>{name}</p>
                <div className='textArrowContainerPersistentLink'>
                    <p className={isActive ? 'PersistentLink-status-text PersistentLink-text-active' : 'PersistentLink-status-text PersistentLink-text-inactive'}>
                        {isActive ? "LINK ACTIVE" : "LINK INACTIVE"}
                    </p>
                    <Down 
                        style={{ marginTop: '5px', cursor: "pointer", transform: (isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'), marginTop: (isExpanded ? '-3px' : '8px')}} 
                        onClick={toggleExpand} 
                    />
                </div>
            </div>

            <div style={{ display: isExpanded ? "flex" : "none" }} className='PersistentLink-content'>
                <div className="left-box">
                    <div className="field">
                        <label htmlFor="Output Device">Output Device:</label>
                        {isEditing ? (
                            <input type="text" id="Output Device" name="Output Device" value={outputDevice} onChange={(e) => setOutputDevice(e.target.value)} />
                        ) : (
                            <span>{outputDevice}</span>
                        )}
                    </div>
                    <div className="field">
                        <label htmlFor="Output Name">Output Name:</label>
                        {isEditing ? (
                            <input type="text" id="Output Name" name="Output Name" value={outputName} onChange={(e) => setOutputName(e.target.value)} />
                        ) : (
                            <span>{outputName}</span>
                        )}
                    </div>
                    <div className="field">
                        <label htmlFor="Input Device">Input Device:</label>
                        {isEditing ? (
                            <input type="text" id="Input Device" name="Input Device" value={inputDevice} onChange={(e) => setInputDevice(e.target.value)} />
                        ) : (
                            <span>{inputDevice}</span>
                        )}
                    </div>
                    <div className="field">
                        <label htmlFor="Input Name">Input Name:</label>
                        {isEditing ? (
                            <input type="text" id="Input Name" name="Input Name" value={inputName} onChange={(e) => setInputName(e.target.value)} />
                        ) : (
                            <span>{inputName}</span>
                        )}
                    </div>
 
                </div>
                <div className="right-box">
                    <h3>Link Controls:</h3>
                    <div className="buttons">
                        <div><button onClick={requestLink}>Activate </button></div>
                        <div><button onClick={breakLink_By_LinkName}>Deactivate</button></div>
                        <div><button onClick={breakPersistentLink}>Delete</button></div>
                    </div>
                    <div className='info'>
                        <p className='infoText'> <Info style={{'height': '1em','width': '1em',  'marginTop': '3px', 'marginRight': '8px'}}/> Info </p> 
                        <p className='infoText'>Links become inactive when both devices or I/O components are unavailable, or when they are explicitly deactivated. This deactivation persists only until one of the devices disconnects and reconnects.</p>
                    </div>   
                </div>
            </div>
        </div>
    );
}

export default PersistentLink;
