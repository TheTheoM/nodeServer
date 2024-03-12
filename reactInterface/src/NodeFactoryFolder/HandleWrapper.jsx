import React, { useState, useHook, useEffect, useCallback } from "react";
import { Handle, Position } from 'reactflow';
import "./nodeFactoryStyles.css"


function HandleWrapper({type, id,  style, isConnectable }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMenuVisible, setMenuVisible] = useState(false);

  const handleHover = () => {
    setMenuVisible(true);
  };

  const handleLeave = () => {
    setMenuVisible(false);
  };

  useEffect(() => {
  }, [isMenuVisible])


  return (
    <div className="HandleContainer" onMouseEnter={handleHover} onMouseLeave={handleLeave}>
        <Handle  type={type} id = {id}  style = {style} isConnectable={isConnectable} onMouseEnter={handleHover} onMouseLeave={handleLeave}/>
            {(isMenuVisible) ? 
                <div className={`handleHoverMenu  ${type === "source" ? " output" : " input"}`}>
                    <p>{id}</p>
                </div>
                :    
                null
            }
    </div>
  );
}

export default HandleWrapper;
