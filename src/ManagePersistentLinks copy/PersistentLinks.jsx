import React, { useEffect, useState, useRef } from 'react';
import RectangleDiv from "../rectangleDiv"
import './PersistentLinks.css'

const PersistentLinks = (props) => {
    const [deviceList, setDeviceList] = useState(["a", "b", "bo", "d"])
    const [newLinkData, setNewLinkData] = useState({
          outputDeviceName : props.outputDeviceName,
          inputDeviceName  : props.inputDeviceName,
          outputName       : props.outputName,
          inputName        : props.inputName,
    });
    const prevProps = useRef(props);

    useEffect(() => {
      // Check if any of the props values have changed
      if (
        prevProps.current.outputDeviceName !== props.outputDeviceName ||
        prevProps.current.inputDeviceName !== props.inputDeviceName ||
        prevProps.current.outputName !== props.outputName ||
        prevProps.current.inputName !== props.inputName
      ) {
        // Update the state with the new prop values
        setNewLinkData({
          outputDeviceName: props.outputDeviceName,
          inputDeviceName: props.inputDeviceName,
          outputName: props.outputName,
          inputName: props.inputName,
        });
      }
  
      prevProps.current = props;
    }, [props]);

    function handleInputChange(name, event) {
      setNewLinkData((prevVal) => { return {...prevVal, [name]: event.target.value}})
      if (event.key === 'Enter') {
        // let val  = event.target.value;
        // TODO some validation objectkeys includes name
      }
    };


    function onUpdateButton() {
      console.log('runs')
      props.updatePersLink(newLinkData.outputDeviceName, newLinkData.outputName, newLinkData.inputDeviceName,newLinkData.inputName)
    }
    function ontoggleConfigButton() {
      if (newLinkData.outputDeviceName && newLinkData.inputDeviceName 
          && newLinkData.outputName && newLinkData.inputName)        
          {
          props.Server_BreakPermanentLink(newLinkData.outputDeviceName, newLinkData.outputName, newLinkData.inputDeviceName,newLinkData.inputName)
      }
    }

    return  (
     <div className="PersistentLink">
        {/* <div className="titleDiv titleDivPersistentLink"> <p>{props.name}</p></div> */}
        <div className="PersLinkInfo">
              <div className="IOColumnParent">
                <div className="IOColumn outputColumn">
                  <div className="">
                    <h4>Output Device:</h4>
                    <div className="PersLinkBox">
                      <input value = {newLinkData.outputDeviceName} onChange={(e) => handleInputChange('outputDeviceName', e)}/>
                    </div>
                  </div>
                  <div className="">  
                      <h4>IO Name:</h4>
                    <div className="PersLinkBox">
                      <input value = {newLinkData.outputName} onChange={(e) => handleInputChange('outputName', e)}/>
                    </div>
                  </div>
                </div>
                <div className="IOColumn inputColumn">
                  <div className="">
                    <h4>Input Device:</h4>
                    <div className="PersLinkBox">
                      <input value = {newLinkData.inputDeviceName} onChange={(e) => handleInputChange('inputDeviceName', e)}/>
                    </div>
                  </div>
                  <div className="">  
                    <h4>IO Name:</h4>
                    <div className="PersLinkBox">
                      <input value = {newLinkData.inputName} onChange={(e) => handleInputChange('inputName', e)}/>
                    </div>
                  </div>
                </div>
              </div>

            <div className="PersLinkDelButton">
                <button className='UpdateButton' onClick={onUpdateButton}>Update</button>
                <button className='toggleConfigButton' onClick={ontoggleConfigButton}>Delete Link</button>
            </div>
        </div>
     </div>
    )
}

export default PersistentLinks;