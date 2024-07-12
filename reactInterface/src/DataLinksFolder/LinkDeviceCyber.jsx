import React, { useEffect, useState } from 'react';
import Plug from "../IconComponents/plug"
import Socket from "../IconComponents/socket"
import BreakLink from "../IconComponents/BreakLink"
import DisconnectLink from "../IconComponents/DisconnectLink"
import Inspect from "../IconComponents/Inspect"
import "./DataLinksCyber.css"

const LinkDevice = (props) => {
  const [isInspectClicked, setIsInspectClicked] = useState(false)
  const [inspectInterval, setInspectInterval]   = useState()
  const [isDiscMenuVisible, setIsDiscMenuVisible] = useState(false);
  const [isPermMenuVisible, setIsPermMenuVisible] = useState(false);
  const removeLink = () => {
    clearInterval(inspectInterval)
    props.breakLink_By_LinkName(`${props.outputDevice}-${props.outputName}=>${props.inputDevice}-${props.inputName}`)
  };

  const inspectData = () => {
    setIsInspectClicked(!isInspectClicked)

    if (!isInspectClicked) {
      let interval = setInterval(() => {
        props.requestLinkDataInspect(`${props.outputDevice}-${props.outputName}=>${props.inputDevice}-${props.inputName}`)
      }, 300)
      setInspectInterval(interval)
    } else {
      clearInterval(inspectInterval)
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup the interval on component unmount
      clearInterval(inspectInterval);
    };
  }, [inspectInterval]);


  const handleDiscHover = () => {
    setIsDiscMenuVisible(true);
  };

  const handleDiscLeave = () => {
    setIsDiscMenuVisible(false);
  };


  const handlePermHover = () => {
    setIsPermMenuVisible(true);
  };

  const handlePermLeave = () => {
    setIsPermMenuVisible(false);
  };

  const BreakPermanentLink = () => {
    props.Server_BreakPermanentLink(props.outputDevice, props.outputName, props.inputDevice, props.inputName)
  };

  return (
    <div className='LinkDeviceCyber'>
      <div className="weirdShapeContainer">
        <div className="weirdShape">
          <div className="textContainer">
            <div className="linkText">
              <p>DATA LINK</p>
            </div>
          </div>
        </div>
      </div>
      <div className="linkInfoContainer">
        <div className="linkInfo">

          {isInspectClicked ? 
            <div className="lastMessageContainer">
              <div className="lastMessage">
                {props.lastMessage}
              </div>
            </div>
            :
            <div className="infoGrid">
              <div className="cell">
                <h3>Output Device:</h3>
                <p>{props.outputDevice}</p>
              </div>
              <div className="cell">
                <h3>Input Device:</h3>
                <p>{props.inputDevice}</p>
              </div>
              <div className="cell">  
                  <h3>IO Name:</h3>
                  <p>{props.outputName}</p>
              </div>
              <div className="cell">  
                <h3>IO Name:</h3>
                <p>{props.inputName}</p>
              </div>
            </div>  
          }

  
          <div className="linkLastMsg">
          <div>
              <DisconnectLink onClick={removeLink}  className="disconLinkIcon" onMouseEnter={handleDiscHover} onMouseLeave={handleDiscLeave}/>
              {(isDiscMenuVisible) ? 
                  <div className={`handleHoverMenuLinkDevice`}>
                      <p>Disconnect Link</p>
                  </div>
                  :    
                  null
              }
            </div>
            <div className="ViewLinkButtonContainer" onClick = {inspectData}>
              <button>
                <h3>{isInspectClicked ? "< View Link Details >" : "< View Link Data >"}</h3>
              </button>
            </div>
            {props.isPersistent ? 
              <div>
                <BreakLink onClick = {BreakPermanentLink} className = "breakLinkIcon"  onMouseEnter={handlePermHover} onMouseLeave={handlePermLeave}/>
                {(isPermMenuVisible) ? 
                  <div className={`handleHoverMenuLinkDevice`}>
                      <p>Remove Link</p>
                  </div>
                  :    
                  null
              }
              </div> 
              : 'и'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkDevice;


{/* <div className='linkControlContainer'>
{props.isPersistent ? <BreakLink onClick = {BreakPermanentLink} className = "breakLinkIcon"/> : null}
<div className='VerticalLinkControls'>
  <DisconnectLink onClick={removeLink}  className="breakLinkIcon"/>
  <Inspect onClick = {inspectData} className={isInspectClicked ? "inspectLinkDataIconActive" : "inspectLinkDataIcon"}/>
</div>
</div> */}