import React from 'react';
import './Home.css';

import NodeWindow from '../NodePanel/NodeWindow/NodeWindow';
import ServerStatusPanel from '../Server/ServerStatusPanel/ServerStatusPanel';
import LogPanel from '../Server/LogPanel/LogPanel';
import CpuMemGraphs from '../Server/CpuMemGraphs';
function Home() {
  return (
    <div className="home-container">
      <div className="home-box large-box" style={{padding: "0px"}}><NodeWindow height = {"400px"}/></div>
      <div className="home-box small-box">
        <ServerStatusPanel/>
        <CpuMemGraphs style = {{"width":"40%"}}/>
      </div>
      <div className="home-box small-box"><LogPanel maxHeight = {"500px"} initialAutoScroll = {true} /></div>
      {/* <div className="home-box medium-box">Medium Box</div> */}
    </div>
  );
}

export default Home;
