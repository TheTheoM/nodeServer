import React, { useState, useEffect, useContext } from 'react';
import './Server.css';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { MyContext } from '../../ContextProvider/ContextProvider';
import LogPanel from './LogPanel/LogPanel';
import ServerStatusPanel from './ServerStatusPanel/ServerStatusPanel';
import CpuMemGraphs from "./CpuMemGraphs"

Chart.register(...registerables);

function Server() {
  const { context } = useContext(MyContext);

  return (
    <div className="server-container">
      <ServerStatusPanel />
      <LogPanel />
      <CpuMemGraphs/>
    </div>
  );
}

export default Server;
