import React, { useEffect, useState } from 'react';
import RectangleDiv from "../rectangleDiv"
import PersistentLinksCyber from './PersistentLinksCyber.jsx';
import PersistentLinks from './PersistentLinks.jsx';
const ManagePersistentLinks = (props) => {
    const isCyber = 1
    // Check if persitent link name is in active-links, if so isActive == true else false.    

    return (
        <RectangleDiv 
          menuName={"Manage Persistent Links"}
          MenuItem={
            <div className="PersistentLinksContainer">
                {Object.keys(props.persistentLinks).map((linkName) => {
                    if (isCyber) {
                      return <PersistentLinksCyber 
                        name = {linkName}
                        isActive          =  {props.activeLinks[linkName] ? true : false}  
                        outputDeviceName  = {props.persistentLinks[linkName].outputDeviceName}
                        outputName        = {props.persistentLinks[linkName].outputName}
                        inputDeviceName   = {props.persistentLinks[linkName].inputDeviceName}
                        inputName         = {props.persistentLinks[linkName].inputName}
                        Server_BreakPermanentLink    = {props.Server_BreakPermanentLink}
                        updatePersLink               = {props.updatePersLink}
                        availableIO = {(props.availableIO)}
                      />
                    } else {
                      return <PersistentLinks
                        name = {linkName}
                        isActive          =  {props.activeLinks[linkName] ? true : false}  
                        outputDeviceName  = {props.persistentLinks[linkName].outputDeviceName}
                        outputName        = {props.persistentLinks[linkName].outputName}
                        inputDeviceName   = {props.persistentLinks[linkName].inputDeviceName}
                        inputName         = {props.persistentLinks[linkName].inputName}
                        Server_BreakPermanentLink    = {props.Server_BreakPermanentLink}
                        updatePersLink               = {props.updatePersLink}
                        availableIO = {(props.availableIO)}
                        />
                    }

                 })}
            </div>
          }
          isExpanded = {props.isExpanded}
        />
      );

}

export default ManagePersistentLinks;