import React, { useState, useHook, useEffect, useCallback } from "react";
import "./nodeFactoryStyles.css"
import { Handle, Position } from '@xyflow/react';

function HandleWrapper({type, id,  style, isConnectable, className}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [ioClassName, setIoClassName] = useState("input")

  useEffect(() => {
    if (type === "target") {
      setIoClassName("inputShape")
    } else {
      setIoClassName("")
    }
  }, [type])

  const handleHover = () => {
    setMenuVisible(true);
  };

  const handleLeave = () => {
    setMenuVisible(false);
  };



  
  return (
    <div className="HandleContainer"  onMouseEnter={handleHover} onMouseLeave={handleLeave}>
        <Handle   className={`${ioClassName} `  + className} type={type} id = {id} key = {id} style = {style} isConnectable={isConnectable}/>
        {(isMenuVisible) ? 
          <div className={`handleHoverMenu  ${type === "source" ? " output" : " input"} `}>
              <p>{id}</p>
          </div>
          :    
          null
        }
    </div>
  );
}

export default HandleWrapper;
