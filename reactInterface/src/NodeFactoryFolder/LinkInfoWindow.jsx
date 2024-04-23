import { useState, useHook, useEffect, useCallback } from "react";
import "./nodeFactoryStyles.css"
import LinkDeviceCyber from "../DataLinksFolder/LinkDeviceCyber"
import LinkDevice from "../DataLinksFolder/LinkDevice"
function LinkInfoWindow(props) {
  const [title, setTitle] = useState("NAME FAILED")
  const [linkTitle, setLinkTitle] = useState(null)
  const [styleName, setStyleName] = useState(0)

  useEffect(() => {
    if (props.selectedEdgeInfo && props.selectedEdgeInfo.id && props.selectedEdgeInfo.id.includes('.')) {
      const split_id_array = props.selectedEdgeInfo.id.split('.');
      let newTitle = split_id_array[1] + " -> " + split_id_array[3]
      let linkTitle = split_id_array[0] + "-" + split_id_array[1] + "=>" + split_id_array[2] + "-" + split_id_array[3]
      setLinkTitle(linkTitle)
      setTitle(newTitle)
    }
  }, [props.selectedEdgeInfo])

  useEffect(() => {
    if (props.displayLinkData) {
      setStyleName("visible")
    } else {
      setStyleName("invisible")

    }
  }, [props.displayLinkData])
  
  function breakLink_By_LinkName(data) {
    props.breakLink_By_LinkName(data)
    setStyleName("invisible")
    props.hideDisplayLinkData()
  }

    
  function Server_BreakPermanentLink(outputDevice, outputName, inputDevice, inputName) {
    props.Server_BreakPermanentLink(outputDevice ,outputName ,inputDevice ,inputName)
    setStyleName("invisible")
    props.hideDisplayLinkData()
  }
  
  return (
    <div className={`LinkInfoWindowContainer ${styleName}`}>
      <div className={`LinkInfoWindow nodrag ${styleName}`} style = {{borderColor: props.isCyber ? "var(--cyberRed)" :  "black"}}>
        {/* <p>{title}</p> */}
        {props.selectedEdgeInfo && linkTitle && props.activeLinks && Object.keys(props.activeLinks).includes(linkTitle) ?
          props.isCyber ? 
            <LinkDeviceCyber
                key = {linkTitle}
                linkDisplayName    = {props.activeLinks[linkTitle].displayName}
                outputDevice    = {props.activeLinks[linkTitle].outputDevice}
                inputDevice     = {props.activeLinks[linkTitle].inputDevice}
                outputName      = {props.activeLinks[linkTitle].outputName}
                inputName       = {props.activeLinks[linkTitle].inputName}
                lastMessage     = {props.activeLinks[linkTitle].lastMessage}
                isPersistent    = {props.activeLinks[linkTitle].isPersistent}
                breakLink_By_LinkName      = {breakLink_By_LinkName}
                requestLinkDataInspect     = {props.requestLinkDataInspect}
                Server_BreakPermanentLink  = {props.Server_BreakPermanentLink}
            />
            :
            <LinkDevice
            key = {linkTitle}
            linkDisplayName    = {props.activeLinks[linkTitle].displayName}
            outputDevice    = {props.activeLinks[linkTitle].outputDevice}
            inputDevice     = {props.activeLinks[linkTitle].inputDevice}
            outputName      = {props.activeLinks[linkTitle].outputName}
            inputName       = {props.activeLinks[linkTitle].inputName}
            lastMessage     = {props.activeLinks[linkTitle].lastMessage}
            isPersistent    = {props.activeLinks[linkTitle].isPersistent}
            breakLink_By_LinkName      = {breakLink_By_LinkName}
            requestLinkDataInspect     = {props.requestLinkDataInspect}
            Server_BreakPermanentLink  = {Server_BreakPermanentLink}
        />
        :
        null
      }
      </div>
    </div>
  );
}

export default LinkInfoWindow;