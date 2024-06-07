import React, { useEffect, useState, useRef } from 'react';
import RectangleDiv from "../rectangleDiv"
import './PersistentLinksCyber.css'
import Cross from '../IconComponents/Cross';
import Down from "../IconComponents/Down"
const PersistentLinks = (props) => {
    const [newLinkData, setNewLinkData] = useState({
          outputDeviceName : props.outputDeviceName,
          inputDeviceName  : props.inputDeviceName,
          outputName       : props.outputName,
          inputName        : props.inputName,
    });
    const [showConfig, setShowConfig] = useState(0)
    const prevProps = useRef(props);  
    const [keyLengths, setKeyLengths] = useState(["NULL"])
    const [selectedKeyIndex, setSelectedKeyIndex] = useState(-1)
    const [all_encrypt_algorithm, set_All_Encrypt_algorithm] = useState({})
    const [encrypt_algorithm, set_Encrypt_algorithm] = useState("NULL")
    const [preferredHighest, setPreferredHighest] = useState(1)    
    const [enableEncryption, setEnableEncryption] = useState(0)    
    const [encryptionSupported, setEncryptionSupported] = useState(0)
    const [enableHybrid, setEnableHybrid] = useState(0)
    const [dropdown, setDropdown] = useState(0)
    

    function handleInputChange(name, event) {
      setNewLinkData((prevVal) => { return {...prevVal, [name]: event.target.value}})
      if (event.key === 'Enter') {
        // let val  = event.target.value;
        // TODO some validation objectkeys includes name
      }
    };

    function onUpdateButton() {
      console.log(props.name)
      props.updatePersLink(props.name, newLinkData.outputDeviceName, newLinkData.outputName, newLinkData.inputDeviceName,newLinkData.inputName)
    }
    
    function ontoggleConfigButton() {
      if (newLinkData.outputDeviceName && newLinkData.inputDeviceName 
          && newLinkData.outputName && newLinkData.inputName)        
          {
          props.Server_BreakPermanentLink(newLinkData.outputDeviceName, newLinkData.outputName, newLinkData.inputDeviceName,newLinkData.inputName)
      }
    }

    useEffect(() => {
      if (
        prevProps.current.outputDeviceName !== props.outputDeviceName ||
        prevProps.current.inputDeviceName !== props.inputDeviceName ||
        prevProps.current.outputName !== props.outputName ||
        prevProps.current.inputName !== props.inputName
      ) {
        setNewLinkData({
          outputDeviceName: props.outputDeviceName,
          inputDeviceName: props.inputDeviceName,
          outputName: props.outputName,
          inputName: props.inputName,
        });
      }
      prevProps.current = props;
    }, [props]);


    useEffect(() => {
      if (preferredHighest) {
        setSelectedKeyIndex(-1)
      }
    }, [preferredHighest])

    useEffect(() => {
      if (selectedKeyIndex !== -1) {
        setPreferredHighest(0)
      }
    }, [selectedKeyIndex])


    useEffect(() => {

      if (props.availableIO) {
        if (props.availableIO[props.inputDeviceName]) {
          if (props.availableIO[props.inputDeviceName].hasOwnProperty('supportedEncryptionStandards')) {
            if (Object.keys(all_encrypt_algorithm).length=== 0) {
              let encryptionStandards = props.availableIO[props.inputDeviceName]["supportedEncryptionStandards"]
              set_All_Encrypt_algorithm(encryptionStandards)
              let availableCryptoAlgos = Object.keys(encryptionStandards)
              set_Encrypt_algorithm(availableCryptoAlgos[0])
              let keyArray = Object.keys(encryptionStandards[availableCryptoAlgos[0]].keys)
              setKeyLengths(keyArray)
              setEncryptionSupported(1)
            }
          }
        }
      }
    }, [props.availableIO])

    useEffect(() => {
      console.log(encrypt_algorithm);
      let foundKeys = false;
    
      if (Object.keys(all_encrypt_algorithm).length > 0) {
        if (all_encrypt_algorithm.hasOwnProperty(encrypt_algorithm)) {
          if (all_encrypt_algorithm[encrypt_algorithm].hasOwnProperty("keys")) {
            let keyArray = Object.keys(all_encrypt_algorithm[encrypt_algorithm].keys);
            setKeyLengths(keyArray);
            foundKeys = true;
          }
        }
      }
    
      if (!foundKeys) {
        setKeyLengths(['null']);
      }
    }, [encrypt_algorithm]);
    


    function enableEncryptionCallback() {
      if (encrypt_algorithm && preferredHighest || encrypt_algorithm && keyLengths[selectedKeyIndex] ) {
        if (keyLengths.length !== 0) {
          setEnableEncryption(!enableEncryption)
          setShowConfig(0)
          props.updatePersLink(props.name, newLinkData.outputDeviceName, newLinkData.outputName, newLinkData.inputDeviceName, newLinkData.inputName,
                              encrypt_algorithm, keyLengths[selectedKeyIndex], preferredHighest, enableHybrid)
        }
      }
    }

    return  (
      <div className="PersistentLinkContainerCyber">
        {!showConfig ? 
          <div className="PersistentLinkCyber">
            <div className="LeftShape">
                <div className="textContainer">
                  <p>{props.isActive ? "LINK ACTIVE" : "OFFLINE"}</p>
                </div>
            </div>
            <div className="PersLinkInfo">
              <div className="PersTitleBox">
                <p>{`${(props.outputName)} > ${(props.inputName)}`}</p>
                <div style={{marginRight: "15px"}}>
                  <Cross onClick={ontoggleConfigButton} className="cross" width = "1em" height = "1em" color = "#B22222"/>
                </div>
              </div>
              <div className="infoGrid PersistentInfoGrid">
                  <div className="cell">
                    <h3>Output Device:</h3>
                    <input value = {newLinkData.outputDeviceName} onChange={(e) => handleInputChange('outputDeviceName', e)}/>
                    
                  </div>
                  <div className="cell">
                    <h3>Input Device:</h3>
                      <input value = {newLinkData.inputDeviceName} onChange={(e) => handleInputChange('inputDeviceName', e)}/>
                  </div>
                  <div className="cell">  
                      <h3>IO Name:</h3>
                    <input value = {newLinkData.outputName} onChange={(e) => handleInputChange('outputName', e)}/>
                  </div>
                  <div className="cell">  
                    <h3>IO Name:</h3>
                    <input value = {newLinkData.inputName} onChange={(e) => handleInputChange('inputName', e)}/>
                  </div>
              </div>  
              <div className="UpdatePersLinkContainer">
                <div className="UpdateButtonContainer disabled">
                  <button className="disabled" onClick={onUpdateButton}>
                    <h3>Update IO</h3>
                  </button>
                </div>
                <div className="configButtonContainer">
                  <button className='toggleConfigButton' onClick={() => {setShowConfig(!showConfig)}}>
                    <h3>View Link Config</h3>
                  </button>
                </div>
              </div>
            </div>
          </div>        
        :
          <div className="PersistentLinkCyber">

              <div className="PersLinkInfo">
                <div className="PersTitleBox">
                  <p>{`${(props.outputName)} > ${(props.inputName)}`}</p>
                  <div className="crossDropShadow">
                    <Cross onClick={ontoggleConfigButton} className="cross" width = "1em" height = "1em" color = "#B22222"/>
                  </div>
                </div>

                  <div className="EncryptionWindow">
                    {encryptionSupported ? 
                      <>
                        <div className='title'>
                          <p>ENCRYPTION CONFIG:</p>
                          <div className="dropdownContainer">
                            <div className='dropdown' onClick = {() => {setDropdown(!dropdown)}}>
                                <p style={{width: "50%", float: 'left', marginLeft: "3px"}}>{encrypt_algorithm}</p>
                                <Down style={{width: "40%", float: 'right'}} />
                            </div>
                            {dropdown ? 
                              <div className="dropdownOptions">
                                {Object.keys(all_encrypt_algorithm).map((item, index) => {
                                  if (item !== encrypt_algorithm) {
                                    return <p onClick = {() => {setDropdown(!dropdown); set_Encrypt_algorithm(item)}}>{item}</p>
                                  }
                                })}
                              </div>
                            : ""}
                          </div>
                        </div>
                        <div className='title'>
                          <div className="KeyLengthContainer">
                            {keyLengths.map((item, index) => (
                                <p onClick={() => {setSelectedKeyIndex(index)}} className={index === selectedKeyIndex ? "selectedKeyCyber" : ""}>{item}</p> 
                            ))}
                          </div>
                          <button style={{width: "140px", height: "30px"}} className={preferredHighest ? "activeCyberBt" : ""}
                              onClick={() => {setPreferredHighest(!preferredHighest)}}>Prefer Highest</button>
                        </div>

                        <button  className={enableHybrid ? "activeCyberBt" : ""}
                              onClick={() => {setEnableHybrid(!enableHybrid)}}>
                              Enable Hybrid-Encryption (AES)
                        </button>
                      </>
                      :
                      <h1 style={{textAlign: 'center'}}>ENCRYPTION NULL</h1>
                                      
                  }
                  </div>  
                  
                  <div className="UpdatePersLinkContainer">
                    <div className="UpdateButtonContainer disabled">
                      <button className="disabled" onClick={enableEncryptionCallback}>
                        <h3>Encryption </h3>
                      </button>
                    </div>
                    <div className="configButtonContainer">
                      <button className='toggleConfigButton' onClick={() => {setShowConfig(!showConfig)}}>
                        <h3>View IO Info </h3>
                      </button>
                    </div>
                  </div>
              </div>
          </div>
        }
      </div>
    )
  }
  
  export default PersistentLinks;

//   <button className='toggleConfigButton' onClick={ontoggleConfigButton}>
//   <h3>Config Link</h3>
// </button>


  {/* <div className="PersLinkInfo">
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
  </div> */}