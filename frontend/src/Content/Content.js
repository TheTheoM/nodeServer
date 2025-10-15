import './content.css'; 
import Home from '../dashboardComponents/Home/Home';
import NodePanel from '../dashboardComponents/NodePanel/NodePanel';
import Processes from '../dashboardComponents/Processes/Processes';
import Server from '../dashboardComponents/Server/Server';
import Devices from '../dashboardComponents/Devices/Devices';
import TopBar from './TopBar';

import React, { useEffect, useState, useRef } from 'react';

const Content = ({ selectedTab, showNavBar, setShowNavBar, isSmallScreen }) => {

    
    let ComponentToRender;
    let componentProps = {}; 

    switch (selectedTab) {
        case 'Home':
            ComponentToRender = Home;
            break;
        case 'Nodes':
            ComponentToRender = NodePanel;
            break;
        case 'Processes':
            ComponentToRender = Processes;
            break;
        case 'Server':
            ComponentToRender = Server;
            break;
        case 'Devices':
            ComponentToRender = Devices;
            break;
        default:
            ComponentToRender = () => <div>Select a tab</div>;
    }

    return (
            <div className="content-container">
                <TopBar currentTab={selectedTab} showNavBar = {showNavBar} setShowNavBar = {setShowNavBar}  isSmallScreen = {isSmallScreen}/>
                <div className='component-container'>
                    <ComponentToRender  />
                </div>
            </div>
    );
};

export default Content;
