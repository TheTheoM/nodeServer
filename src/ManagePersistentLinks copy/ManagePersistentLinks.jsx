import React, { useEffect, useState } from 'react';
import RectangleDiv from "../rectangleDiv"
import PersistentLinks from './PersistentLinks.jsx';
const ManagePersistentLinks = (props) => {
    // const [allDeviceList, setAllDeviceList] = useState()

    return (
        <RectangleDiv 
          menuName={"Manage Persistent Links"}
          MenuItem={
            <div className="PersistentLinkContainer">
                {Object.keys(props.persistentLinks).map((linkName) => {

                    return <PersistentLinks 
                      name = {linkName}
                      outputDeviceName  = {props.persistentLinks[linkName].outputDeviceName}
                      outputName        = {props.persistentLinks[linkName].outputName}
                      inputDeviceName   = {props.persistentLinks[linkName].inputDeviceName}
                      inputName         = {props.persistentLinks[linkName].inputName}
                      Server_BreakPermanentLink  = {props.Server_BreakPermanentLink}
                      updatePersLink    = {props.updatePersLink}
                    />
                 })}
            </div>
          }
        />
      );

}

export default ManagePersistentLinks;