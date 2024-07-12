import React, { useEffect, useState } from 'react';
import RectangleDiv from "../rectangleDiv"
import PersistentLinksCyber from './PersistentLinksCyber.jsx';
import PersistentLinks from './PersistentLinks.jsx';
import Encrypt from '../IconComponents/Encrypt.jsx';

const ManagePersistentLinks = (props) => {
    const [isCyber, setIsCyber] = useState(0)
    // Check if persitent link name is in active-links, if so isActive == true else false.    

    return (
        <RectangleDiv 
          menuName={"Manage Persistent Links"}
          rightItemList={[<div className='resizeArrowContainer' onClick={() => {setIsCyber(!isCyber)}} ><Encrypt width = {'1.2rem'}/></div>]}

          MenuItem={
            <div className="PersistentLinksContainer">
                {Object.keys(props.persistentLinks).map((linkName) => {
                    if (isCyber) {
                      return <PersistentLinksCyber 
                        name = {linkName}
                        key = {linkName}
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
                        key = {linkName}
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