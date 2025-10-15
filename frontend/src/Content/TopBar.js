import React from 'react';
import './Topbar.css';

const TopBar = ({currentTab, showNavBar, setShowNavBar, isSmallScreen}) => {
    return (
        <div className="topbar">
            {isSmallScreen && (
                <div className='buttonContainer'>
                    <button className="toggle-button" onClick={() => {setShowNavBar(!showNavBar)}}>
                        <div className={`menuIcon rotateMenu`}>☰</div>
                    </button>
                </div>    
            )}
            <span className="topbar-text">{currentTab}</span>
        </div>
    );
};

export default TopBar;
