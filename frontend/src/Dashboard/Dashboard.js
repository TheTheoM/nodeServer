import React, { useState, useEffect } from 'react';
import './Dashboard.css'; 
import Home from "../IconComponents/Home";
import NodePage from "../IconComponents/NodePage";
import ProcessesIcon from "../IconComponents/ProcessesIcon";
import Server from "../IconComponents/Server";
import Content from '../Content/Content';
import Devices from "../IconComponents/Devices";
import Notification from '../Notification/Notification';
import AccountDropdown from '../AccountDropdown/AccountDropdown';

const Dashboard = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState("Home")
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const [showNavBar, setShowNavBar] = useState(false);
    const maxWidth = 800;
    
    useEffect(() => {
      const mediaQuery = window.matchMedia(`(max-width: ${maxWidth}px)`);
      const handleScreenChange = (e) => {
        setShowNavBar(e.matches)
        setIsSmallScreen(e.matches)
    };
      handleScreenChange(mediaQuery);
      mediaQuery.addEventListener('change', handleScreenChange);
      return () => mediaQuery.removeEventListener('change', handleScreenChange);
    }, []);

    const toggleNavbar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="dashboard-container">
            {!showNavBar ? 
                <div className={`navbar ${isOpen ? 'active' : ''}`}>
                    {!isSmallScreen && (
                        <div className='buttonContainer'>
                        <button className="toggle-button" onClick={toggleNavbar}>
                            <div className={`menuIcon ${isOpen ? 'rotateMenu' : ''}`}>☰</div>
                        </button>
                    </div>
                    )}
                    {isOpen ? (
                        <ul className="nav-list">
                            <li className = {selectedTab === 'Home' ? 'selectedTab' : ''}      onClick={() => setSelectedTab('Home')}>      <Home /><a href="#Home">Home</a></li>
                            <li className = {selectedTab === 'Nodes' ? 'selectedTab' : ''}     onClick={() => setSelectedTab('Nodes')}>     <NodePage /><a href="#services">Nodes</a></li>
                            <li className = {selectedTab === 'Processes' ? 'selectedTab' : ''} onClick={() => setSelectedTab('Processes')}> <ProcessesIcon /><a href="#about">Processes</a></li>
                            <li className = {selectedTab === 'Server' ? 'selectedTab' : ''}    onClick={() => setSelectedTab('Server')}>    <Server /><a href="#contact">Server</a></li>
                            <li className = {selectedTab === 'Devices' ? 'selectedTab' : ''}    onClick={() => setSelectedTab('Devices')}>    <Devices /><a href="#contact">Devices</a></li>
                        </ul>
                    ) : (
                        <ul className="nav-list">
                            <li className = {selectedTab === 'Home' ? 'selectedTab' : ''}  onClick={() => setSelectedTab('Home')}>            <Home /></li>
                            <li className = {selectedTab === 'Nodes' ? 'selectedTab' : ''}  onClick={() => setSelectedTab('Nodes')}>          <NodePage /></li>
                            <li className = {selectedTab === 'Processes' ? 'selectedTab' : ''}  onClick={() => setSelectedTab('Processes')}>  <ProcessesIcon /></li>
                            <li className = {selectedTab === 'Server' ? 'selectedTab' : ''}  onClick={() => setSelectedTab('Server')}>        <Server /></li>
                            <li className = {selectedTab === 'Devices' ? 'selectedTab' : ''}    onClick={() => setSelectedTab('Devices')}>    <Devices /></li>

                        </ul>
                    )}
                </div>
            :
                null
            }

            <Content selectedTab = {selectedTab} showNavBar = {showNavBar} setShowNavBar = {setShowNavBar} isSmallScreen = {isSmallScreen}/>

            <Notification/>
            <AccountDropdown/>
            
        </div>
    );
};

export default Dashboard;