import React, { useState, useEffect, useContext, useRef } from 'react';
import './LogPanel.css';
import { MyContext } from '../../../ContextProvider/ContextProvider';
import Down from '../../../IconComponents/Down';

function LogPanel({maxHeight, initialAutoScroll}) {
  const { context } = useContext(MyContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [devicesVisible, setDevicesVisible] = useState(false);
  const [selectedDevices, setSelectedDevice] = useState(Object.keys(context.availableIO));
  const [deviceList, setDeviceList] = useState([])
  const [selectedLogTypes, setSelectedLogTypes] = useState(["Warning", "Error", "Info", "Success"]);
  const [autoScroll, setAutoScroll] = useState(initialAutoScroll);
  const [hasWebSocketBeenClosed, setHasWebSocketBeenClosed] = useState(false)
  const filterRef        = useRef(null);
  const filterButtonRef  = useRef(null);
  const devicesRef       = useRef(null);
  const devicesButtonRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtersVisible && filterRef.current && !filterRef.current.contains(event.target) && !filterButtonRef.current.contains(event.target)) {
        setFiltersVisible(false);
      }
      if (devicesVisible && devicesRef.current && !devicesRef.current.contains(event.target) && !devicesButtonRef.current.contains(event.target)) {
        setDevicesVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filtersVisible, devicesVisible]);

  useEffect(() => {
    scrollToBottomOfLogs() 
  }, [])


  useEffect(() => {

          if (deviceList.length !== Object.keys(context.availableIO).length) {
            setDeviceList(Object.keys(context.availableIO))
            setSelectedDevice(Object.keys(context.availableIO))
          }
  }, [context.availableIO])


  
  useEffect(() => {
    if (autoScroll) {
      scrollToBottomOfLogs()
    }
  }, [autoScroll, context.deviceLogs]);

  function scrollToBottomOfLogs() {
    const logList = document.getElementsByClassName("log-list")[0];
    if (logList) {
      logList.scrollTop = logList.scrollHeight;
    }
  }
  
  const handleDeviceClick = (selectedDeviceName, event) => {
    if (event.shiftKey) {
      setSelectedDevice([selectedDeviceName]);
      context.deviceLogsFunctions.filterLogsCallback({
        "alerts": selectedLogTypes,
        "selectedDevices": [selectedDeviceName],
        "search": searchQuery
      });
    } else {
      if (selectedDevices.includes(selectedDeviceName)) {
        setSelectedDevice(selectedDevices.filter((deviceName) => deviceName !== selectedDeviceName));
        context.deviceLogsFunctions.filterLogsCallback({
          "alerts": selectedLogTypes,
          "selectedDevices": selectedDevices.filter((deviceName) => deviceName !== selectedDeviceName),
          "search": searchQuery
        });
      } else {
        setSelectedDevice([...selectedDevices, selectedDeviceName]);
        context.deviceLogsFunctions.filterLogsCallback({
          "alerts": selectedLogTypes,
          "selectedDevices": [...selectedDevices, selectedDeviceName],
          "search": searchQuery
        });
      }
    }
  };

  useEffect(() => {
    context.deviceLogsFunctions.filterLogsCallback({
      "alerts": selectedLogTypes,
      "selectedDevices": selectedDevices,
      "search": searchQuery
    });
  }, [searchQuery, context.deviceLogsFunctions, selectedDevices, selectedLogTypes]);

  const handleLogFilterButtons = (log_type) => {
    if (selectedLogTypes.includes(log_type)) {
      setSelectedLogTypes(selectedLogTypes.filter((btn) => btn !== log_type));
      context.deviceLogsFunctions.filterLogsCallback({
        "alerts": selectedLogTypes.filter((btn) => btn !== log_type),
        "selectedDevices": selectedDevices,
        "search": searchQuery
      });
    } else {
      setSelectedLogTypes([...selectedLogTypes, log_type]);
      context.deviceLogsFunctions.filterLogsCallback({
        "alerts": [...selectedLogTypes, log_type],
        "selectedDevices": selectedDevices,
        "search": searchQuery
      });
    }
  };

  return (
    <div className="server-logs">
      <h3>Recent Logs</h3>
      <div className="log-search">
        <input
          type="text"
          placeholder="Search logs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="log-search-input"
        />

        <div className='log-filter-button-container'>
          <button
            className="log-filter-button"
            ref = {filterButtonRef}
            onClick={() => { setFiltersVisible(!filtersVisible); setDevicesVisible(false); }}
          >
            Log Types
          </button>

          {filtersVisible && (
            <div ref={filterRef} className="log-filters">
              <label>
                <input type="checkbox" checked={selectedLogTypes.includes("Warning")} onClick={() => { handleLogFilterButtons("Warning") }} /> Warning
              </label>
              <label>
                <input type="checkbox" checked={selectedLogTypes.includes("Error")} onClick={() => { handleLogFilterButtons("Error") }} /> Error
              </label>
              <label>
                <input type="checkbox" checked={selectedLogTypes.includes("Info")} onClick={() => { handleLogFilterButtons("Info") }} /> Info
              </label>
              <label>
                <input type="checkbox" checked={selectedLogTypes.includes("Success")} onClick={() => { handleLogFilterButtons("Success") }} /> Success
              </label>
            </div>
          )}
        </div>

        <div className='log-devices-button-container'>
          <button
            className="log-filter-button"
            onClick={() => { setDevicesVisible(!devicesVisible); setFiltersVisible(false); }}
            ref = {devicesButtonRef}
          >
            Devices
          </button>
          {devicesVisible && (
            <div ref={devicesRef} className="log-devices">
              {Object.keys(context.availableIO).map((device, index) => (
                <div
                  key={index}
                  className={`device-item ${selectedDevices.includes(device) ? "selected" : ""}`}
                  onClick={(event) => { handleDeviceClick(device, event); }}
                >
                  {device}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className='log-list-container'>
        <div className='log-controls'>
          <Down onClick={() => { setAutoScroll(!autoScroll); }} style={{ 'marginBottom': "-6px", 'color': (autoScroll ? 'var(--selected-item)' : '') }} />
        </div>
        <ul className="log-list" style={{"maxHeight": maxHeight}}>
          {context.deviceLogs.map((log, index) => (
            <li key={index} className={`log-item ${log.log_type}`}>
              <div className="log-banner">
                <p>{log.name.toLocaleUpperCase()}</p>
                <p>{new Date(log.log_time).toLocaleTimeString()}</p>
              </div>
              <div className="log-message">{log.log}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default LogPanel;
