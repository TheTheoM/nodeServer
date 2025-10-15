import './App.css';
import Dashboard from './Dashboard/Dashboard';
 import { MyContext } from './ContextProvider/ContextProvider';
import React, { useState, useEffect, useContext } from 'react';
import Login from './Login/Login';

function App() {
  const { context } = useContext(MyContext);

  const [isAuthorized, setIsAuthorized] = useState(0)
  
  return (
    <div className="App">
      {context.authorization.authorizationState === "unauthorized" ||
      context.authorization.authorizationState === "badCredentials" ?
        <Login/>
      :
        <div className="dashboardContainer">
          <Dashboard/>
        </div> 
      }
    </div>
  );
}

export default App;
