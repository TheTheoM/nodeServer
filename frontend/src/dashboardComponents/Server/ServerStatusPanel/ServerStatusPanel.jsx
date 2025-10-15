import React, { useState, useEffect, useContext } from 'react';
import './ServerStatusPanel.css'
import { MyContext  } from '../../../ContextProvider/ContextProvider';


function ServerStatusPanel({height, width}) {
    const { context } = useContext(MyContext );

    return (
        <div className="server-status" style={{'height': height, "width": width}}>
            <h3>Server Status</h3>
                <div className="status-item">
                    <span className="status-label">CPU Usage:</span>
                    <span className="status-value">{context.serverData.CPU.current_Usage}%</span>
                </div>
            <div className="status-item">
                <span className="status-label">Memory Usage:</span>
                <span className="status-value">{context.serverData.RAM.RAM_Usage} / {context.serverData.RAM.total_RAM}</span>
            </div>
            <div className="status-item">
                <span className="status-label">Disk Usage:</span>
                <span className="status-value">{context.serverData.STORAGE.current_Usage} / {context.serverData.STORAGE.total_Storage}</span>
            </div>
            <div className="status-item">
                <span className="status-label">Network Traffic:</span>
                <span className="status-value">{context.serverData.NETWORK.current_Traffic}</span>
            </div>
        </div>
    )
}
export default ServerStatusPanel;
