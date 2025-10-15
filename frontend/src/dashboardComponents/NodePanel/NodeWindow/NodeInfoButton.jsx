import React, { useEffect, useState } from "react";
import "./nodeFactoryStyles.css";
import Info from "../../../IconComponents/Info";
function NodeInfoWindow({onClick}) {
  return (
    <div className="NodeInfoWindow" onClick={onClick}>
      <Info className="infoIcon"/>
    </div>
  );
}

export default NodeInfoWindow;
