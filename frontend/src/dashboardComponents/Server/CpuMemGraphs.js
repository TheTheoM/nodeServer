import React, { useState, useEffect, useContext } from 'react';
import './Server.css';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { MyContext } from '../../ContextProvider/ContextProvider';

Chart.register(...registerables);

function CpuMemGraphs(style) {
  const { context } = useContext(MyContext);

  const ChartOptions = {
    responsive: true,
    animation: {
      duration: 0,
    },
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,   
        max: 100, 
      },
      x: {
        display: false,
      }
    },
    elements: {
      point:{
          radius: 0
      }
    }
  };
  
  const cpuChartData = {
    labels: Array.from({ length: context.serverData.CPU.data.length }, (_, i) => i + 1),
    datasets: [
      {
        label: 'CPU Usage',
        data: context.serverData.CPU.data,
        fill: false,
        backgroundColor: 'rgba(75,192,192,1)',
        borderColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  const memoryChartData = {
    labels: Array.from({ length: context.serverData.RAM.data.length }, (_, i) => i + 1),
    datasets: [
      {
        label: 'Memory Usage',
        data: context.serverData.RAM.data,
        fill: false,
        backgroundColor: 'rgba(153,102,255,1)',
        borderColor: 'rgba(153,102,255,1)',
      },
    ],
  };

  return (
    <div className="server-graphs" style={style}>
      <div className="graph-box">
        <h4>CPU Usage Over Time</h4>
        <Line data={cpuChartData} options={ChartOptions} />
      </div>
      <div className="graph-box">
        <h4>Memory Usage Over Time</h4>
        <Line data={memoryChartData} options={ChartOptions} />
      </div>
    </div>
  );
}

export default CpuMemGraphs;
