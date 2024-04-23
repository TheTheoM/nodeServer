import React, { useEffect, useRef, useState } from 'react';
import Plug from "../IconComponents/plug"
import Socket from "../IconComponents/socket"
import "./linkFactoryStyles.css"

const RequestLink = ({linkName, outputDevice, outputName, inputDeviceName, inputName, rejectLinkCallback, acceptLinkCallback, acceptPersistentLinkCallback}) => {

    function rejectLink() {
        rejectLinkCallback(outputDevice, outputName, inputDeviceName, inputName)
    }

    function acceptLink() {
        acceptLinkCallback(outputDevice, outputName, inputDeviceName, inputName)
    }

    function persistentLink() {
        acceptPersistentLinkCallback(outputDevice, outputName, inputDeviceName, inputName)
    }

    return (
        <div className="potentialLink">
            <div className="infoContainer">
                <div className="info">
                    <div className="deviceInfoContainer outputDeviceInfo">
                        <Plug/>
                        <p>{outputDevice}</p>
                        <p>{outputName}</p>
                    </div>
                    <div className="deviceInfoContainer inputDeviceInfo">
                        <Socket/>
                        <p>{inputDeviceName}</p>
                        <p>{inputName}</p>
                    </div>
                </div>
            </div>
            <div className="buttonContainer">
                <div className="linkButton Temporary" onClick={acceptLink}>Temporary</div>
                <div className="linkButton Persistent" onClick={persistentLink}>Persistent</div>
                <div className="linkButton Reject" onClick={rejectLink}>Reject</div>
            </div>

        </div>
    );
}

export default RequestLink;
