import React, { useState, useContext } from 'react';
import { MyContext } from '../ContextProvider/ContextProvider';
import AccountIcon from '../IconComponents/AccountIcon';
import './AccountDropdown.css';

const AccountDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {context} = useContext(MyContext);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    context.user.Logout()
  };

  return (
    <div className="Account-Container">
      <div className="icon" onClick={toggleDropdown}>
        <AccountIcon />
      </div>
      {isOpen && (
        <div className="dropdown">
          <p className="username">{context.user.username}</p>
          <button className="logoutButton" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountDropdown;
