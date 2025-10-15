import React, { useState, useContext} from 'react';
import { MyContext } from '../../ContextProvider/ContextProvider';
import './Devices.css';
import Device from './Device/Device';

function Home() {
    const { context } = useContext(MyContext);
    const [searchTerm, setSearchTerm] = useState(''); 
    console.log(context)

    
    const filteredDevices = Object.entries(context.availableIO).filter(([name]) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
    );
        
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };
        
    return (
        <div className="devicesTab-container">
            <div className="devices-subcontainer">
                <h3>Connected Devices</h3>
                <input 
                    type="text" 
                    placeholder="Search devices..." 
                    className="device-searchbar"
                    value={searchTerm} 
                    onChange={handleSearchChange} 
                />
                <div className="device-list-container" id="device-list-bob">
                <div className="device-list" >
                    {filteredDevices.map(([name, device]) => (
                        <Device
                            key            = {name}
                            name           = {name}
                            inputs         = {device.inputs}
                            outputs        = {device.outputs}
                            all_inputs     = {device.all_inputs}
                            all_outputs    = {device.all_outputs}
                            widgets        = {device.widgets}
                            deviceInfo     = {device.deviceInfo}
                            nodePosition   = {device.nodePosition}
                            isNode         = {device.isNode}
                            connectedTo    = {device.connectedTo}
                            statusState    = {device.statusState}
                            isProcess      = {device.isProcess}
                        />
                    ))}
                </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
// {
//     "inputs": {
//         "toRGBArray": "typeless",
//         "brightness": "typeless",
//         "repeatLeds": "typeless"
//     },
//     "outputs": {
//         "deviceData": "typeless"
//     },
//     "all_inputs": [
//         "toRGBArray",
//         "brightness",
//         "repeatLeds"
//     ],
//     "all_outputs": [
//         "deviceData"
//     ],
//     "widgets": [],
//     "deviceInfo": "RGB Controller",
//     "nodePosition": {
//         "x": 439.4940459863677,
//         "y": -222.4128894900262
//     },
//     "isNode": true,
//     "connectedTo": {
//         "brightness": "icueClient",
//         "repeatLeds": "icueClient2",
//         "toRGBArray": "ICUE Core"
//     },
//     "statusState": "online",
//     "isProcess": false
// }