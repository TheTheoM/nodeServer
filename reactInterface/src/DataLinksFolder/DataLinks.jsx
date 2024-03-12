import React, { useEffect, useState } from 'react';
import RectangleDiv from "../rectangleDiv"
import LinkDeviceCyber from './LinkDeviceCyber';
// import "./DataLinksCyber.css"
// import "./DataLinks.css"
import LinkDevice from './LinkDevice';
const DataLinks = (props) => {
    const isCyber = 1
    return  (
        <RectangleDiv 
            menuName={"Active Data Links:"}
            MenuItem={
                <div className="activeLinksContainer">
                    {Object.keys(props.activeLinks).map((linkName) => {
                        if (isCyber) {
                            return <LinkDeviceCyber
                                key = {linkName}
                                linkDisplayName = {props.activeLinks[linkName].displayName}
                                outputDevice    = {props.activeLinks[linkName].outputDevice}
                                inputDevice     = {props.activeLinks[linkName].inputDevice}
                                outputName      = {props.activeLinks[linkName].outputName}
                                inputName       = {props.activeLinks[linkName].inputName}
                                lastMessage     = {props.activeLinks[linkName].lastMessage}
                                isPersistent    = {props.activeLinks[linkName].isPersistent}
                                breakLink_By_LinkName      = {props.breakLink_By_LinkName}
                                requestLinkDataInspect     = {props.requestLinkDataInspect}
                                Server_BreakPermanentLink  = {props.Server_BreakPermanentLink}
                            />
                        } else {
                           return  <LinkDevice
                            key = {linkName}
                            linkDisplayName = {props.activeLinks[linkName].displayName}
                            outputDevice    = {props.activeLinks[linkName].outputDevice}
                            inputDevice     = {props.activeLinks[linkName].inputDevice}
                            outputName      = {props.activeLinks[linkName].outputName}
                            inputName       = {props.activeLinks[linkName].inputName}
                            lastMessage     = {props.activeLinks[linkName].lastMessage}
                            isPersistent    = {props.activeLinks[linkName].isPersistent}
                            breakLink_By_LinkName      = {props.breakLink_By_LinkName}
                            requestLinkDataInspect     = {props.requestLinkDataInspect}
                            Server_BreakPermanentLink  = {props.Server_BreakPermanentLink}
                        />
                        }
                    })}
                </div>
            }   
            isExpanded = {props.isExpanded}
        />
    )
}

export default DataLinks;