import React, { useState, useHook, useEffect, useCallback, useContext } from "react";
import './Node.css'
import BreakLink from "../../../IconComponents/BreakLink"
import DisconnectLink from "../../../IconComponents/DisconnectLink"
import "./DataLinks.css"
import Cross from "../../../IconComponents/Cross";
import { MyContext } from "../../../ContextProvider/ContextProvider";


const LinkInfoWindow = (props) => {
  const [isInspectClicked, setIsInspectClicked] = useState(false)
  const [inspectInterval, setInspectInterval]   = useState()
  const [isDiscMenuVisible, setIsDiscMenuVisible] = useState(false);
  const [isPermMenuVisible, setIsPermMenuVisible] = useState(false);
  const { context } = useContext(MyContext);
  const [linkData, setLinkData] = useState(context.activeLinks[props.selectedEdgeInfo])
  const [lastMessage, setLastMessage] = useState()


  useEffect(() => {
    setLinkData(context.activeLinks[props.selectedEdgeInfo])
    setIsInspectClicked(0)
  }, [props.selectedEdgeInfo])


  const inspectData = () => {
    setIsInspectClicked(!isInspectClicked)

    if (!isInspectClicked) {
      let interval = setInterval(() => {
        context.linkFunctions.requestLinkDataInspect(`${linkData.outputDevice}-${linkData.outputName}=>${linkData.inputDevice}-${linkData.inputName}`)
        console.log(`${linkData.outputDevice}-${linkData.outputName}=>${linkData.inputDevice}-${linkData.inputName}`)
      }, 300)
      setInspectInterval(interval)
    } else {
      clearInterval(inspectInterval)
    }
  };

  useEffect(() => {
    return () => {
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
    clearInterval(inspectInterval)
    context.linkFunctions.Server_BreakPermanentLink(linkData.outputDevice, linkData.outputName, linkData.inputDevice, linkData.inputName)
    props.setDisplayLinkData(0)
  };

  const removeLink = () => {
    clearInterval(inspectInterval)
    context.linkFunctions.breakLink_By_LinkName(`${linkData.outputDevice}-${linkData.outputName}=>${linkData.inputDevice}-${linkData.inputName}`)
    props.setDisplayLinkData(0)
  };

  function closeLinkData() {
    props.setDisplayLinkData(0)
  }

  useEffect(() => {
      if (context.activeLinks[props.selectedEdgeInfo]) {
        setLastMessage(context.activeLinks[props.selectedEdgeInfo].lastMessage)
      }
}, [context])



  return (
    <div className="LinkInfoWindow">
      <div className="ExitLinkInfo" onClick = {closeLinkData}><Cross/></div>
      <div className='LinkDevice'>
        <div className="linkInfoContainer">
            {isInspectClicked ? 
              <div className="lastMessageContainer">
                <div className="lastMessage">
                  {lastMessage ? 
                    lastMessage
                    :
                    'No Data' 
                  }
                </div>
              </div>
              :
              <div className="infoGrid">
                <div className="cell">
                  <h3>Output Device:</h3>
                  <p>{linkData.outputDevice}</p>
                </div>
                <div className="cell">
                  <h3>Input Device:</h3>
                  <p>{linkData.inputDevice}</p>
                </div>
                <div className="cell">  
                    <h3>IO Name:</h3>
                    <p>{linkData.outputName}</p>
                </div>
                <div className="cell">  
                  <h3>IO Name:</h3>
                  <p>{linkData.inputName}</p>
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
              <button onClick = {inspectData}>
                {isInspectClicked ? <h3>View Link Details</h3> : <h3>View Link Data</h3>}
              </button>
              {linkData.isPersistent ? 
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

export default LinkInfoWindow;

