import React, { useState, useContext, useEffect } from 'react';
import { MyContext } from '../ContextProvider/ContextProvider';
import LoginBackground from "./LoginBackground";
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { context } = useContext(MyContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    context.authorization.sendCredentials(username, password);
  };

  useEffect(() => {
    if (context.authorization.authorizationState === "badCredentials") {
      setError("Incorrect Username or Password");
    } 
  }, [context.authorization.authorizationState]);

  return (
    <div className="login-container">
      <LoginBackground />  
      <div className={`loginDiv ${error ? 'incorrectCredentials' : ''}`}>
        <h1>Login</h1>
        <p className="infoText">Please log in to make changes. You can also proceed in view-only mode.</p>
        <form onSubmit={handleSubmit} className="form">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            placeholder="Username"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(e);
              }
            }}
            className="input"
            placeholder="Password"
            required
          />
          <button type="submit" className="button">Log In</button>
          {error && <p className="error">{error}</p>}
        </form>
        <button onClick={context.authorization.handleViewOnly} className="viewOnlyButton">View Only</button>
      </div>
    </div>
  );
}

export default Login;
