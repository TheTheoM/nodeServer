import React, { useEffect, useState, useRef } from 'react';
import RectangleDiv from "../rectangleDiv"
import './PersistentLinks.css'
import Cross from '../IconComponents/Cross';
import Down from "../IconComponents/Down"
import Encrypt from '../IconComponents/Encrypt';

const PersistentLinks = (props) => {
    const [deviceList, setDeviceList] = useState(["a", "b", "bo", "d"])
    const [newLinkData, setNewLinkData] = useState({
          outputDeviceName : props.outputDeviceName,
          inputDeviceName  : props.inputDeviceName,
          outputName       : props.outputName,
          inputName        : props.inputName,
    });
    const prevProps = useRef(props);
    const [showConfig, setShowConfig] = useState(0)
    const [keyLengths, setKeyLengths] = useState(["NULL"])
    const [selectedKeyIndex, setSelectedKeyIndex] = useState(-1)
    const [all_encrypt_algorithm, set_All_Encrypt_algorithm] = useState({})
    const [encrypt_algorithm, set_Encrypt_algorithm] = useState("NULL")
    const [preferredHighest, setPreferredHighest] = useState(1)    
    const [enableEncryption, setEnableEncryption] = useState(0)    
    const [encryptionSupported, setEncryptionSupported] = useState(0)
    const [dropdown, setDropdown] = useState(0)

    useEffect(() => {
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
          props.updatePersLink(props.name, newLinkData.outputDeviceName, newLinkData.outputName, newLinkData.inputDeviceName, newLinkData.inputName,
                              encrypt_algorithm, keyLengths[selectedKeyIndex], preferredHighest)
        }
      }


    }

    return  (
      <div className="PersistentLink">
        <div className=" titleDiv deviceTitle  " id='statusTitle'>
            <Encrypt width="1.3em" height="1.3em" color  = "turquoise" onClick={() => {setShowConfig(!showConfig)}}/>
            <h3>{`${(props.outputName)} > ${(props.inputName)}`}</h3>
            <Cross onClick={ontoggleConfigButton} className="cross" width = "1em" height = "1em" color = "#B22222" style={{marginTop: "9px"}}/>
        </div>
        {!showConfig ? 
          <>
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
            </div>
          </>
        :
        <>
             <div className="EncryptionWindow">
                  {encryptionSupported ? 
                    <>
                      <div className='title'>
                        <p style={{fontWeight: "bolder"}}>ENCRYPTION CONFIG:</p>
                        <div className="dropdownContainer">
                          <div className='dropdown' onClick = {() => {setDropdown(!dropdown)}}>
                              <p style={{width: "50%", float: 'left', margin: "0px", marginLeft: "4px"}}>{encrypt_algorithm}</p>
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
                              <p onClick={() => {setSelectedKeyIndex(index)}} className={index === selectedKeyIndex ? "selectedKey" : ""}>{item}</p> 
                          ))}
                        </div>
                        <button style={{width: "140px", height: "30px"}} className={(preferredHighest ? "activeBt" : "") + " preferredHighestButton"}
                            onClick={() => {setPreferredHighest(!preferredHighest)}}>Prefer Highest</button>
                      </div>

                      <button  className={(enableEncryption ? "activeCyberBt" : "") + " EnableEncryptionButton"}
                            onClick={enableEncryptionCallback}>
                            Enabled AES Hybrid Encryption
                      </button>
                    </>
                    :
                    <h1 style={{textAlign: 'center'}}>ENCRYPTION NULL</h1>
                                    
                }
              </div>  
                
          <div className="PersLinkDelButton">
                <button className='UpdateButton' onClick={onUpdateButton}>Update</button>
            </div>
        </>
        }

    </div> 
    )
  }
  
  export default PersistentLinks;
