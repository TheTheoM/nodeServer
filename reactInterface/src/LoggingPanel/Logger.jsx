import React, { useCallback, useEffect, useRef, useState } from 'react';
import Down from "../IconComponents/Down"
import Time from "../IconComponents/Time"
import Inspect from "../IconComponents/Inspect"
import CalenderComponent from "./CalenderComponent"
import "./logStyles.css"


export default function Logger(props) {
    const [logs, setLogs] = useState([1])
    const [autoScroll, setAutoScroll] = useState(1)
    const [toggleTime, setToggleTime] = useState(1)
    const [enRegex, setEnRegex]       = useState(0)
    const [deviceList, setDeviceList] = useState([])
    const [selectedDeviceList, setSelectedDeviceList] = useState([])
    const [clickedButtons, setClickedButtons] = useState(["warning", "error", "info", "success"]);
    const [showDeviceWindow, setShowDeviceWindow] = useState(1)
    const isServerConnected = useRef(0)

    const maxLength = 200;

    useEffect(() => {
        if (autoScroll) {
            var objDiv = document.getElementsByClassName("logs")[0];
            objDiv.scrollTop = objDiv.scrollHeight;
        }
    }, [autoScroll, logs])

    useEffect(() => {
        let localLog = [];
        let logData = props.deviceLogs;
        if (props.deviceLogs.length > 0) {
            // let logData = props.deviceLogs.slice(-1 * maxLength - 1, -1);
            let index = 0;
            for (let log of logData) {
                localLog.push(
                    <div className={`Log ${log.logType}`} key = {index++}>
                        [{log.name}]: {log.log} {toggleTime ? new Date(log.time).toUTCString() : ""}
                    </div>
                );   
            }
        }
        setLogs(localLog);
    }, [props.deviceLogs, toggleTime]);
    
    
    const handleButtonClick = (buttonName) => {
        if (clickedButtons.includes(buttonName)) {
            setClickedButtons(clickedButtons.filter((btn) => btn !== buttonName));
            props.filterLogsCallback({"alerts": clickedButtons.filter((btn) => btn !== buttonName)})
        } else {
            setClickedButtons([...clickedButtons, buttonName]);
            props.filterLogsCallback({"alerts": [...clickedButtons, buttonName]})

        }
    };

    const handleDeviceClick = (deviceName) => {
        if (selectedDeviceList.includes(deviceName)) {
          setSelectedDeviceList(selectedDeviceList.filter((btn) => btn !== deviceName));

        } else {
          setSelectedDeviceList([...selectedDeviceList, deviceName]);

        }
    };
    
    useEffect(() => {
        if (Object.keys(props.availableIO).length > 0) {
            props.filterLogsCallback({"selectedDevices": selectedDeviceList})
        }
    }, [selectedDeviceList])

    useEffect(() => {
        let newDeviceList = Object.keys(props.availableIO)
        if (JSON.stringify(deviceList) !== JSON.stringify(newDeviceList)) {
            setDeviceList(newDeviceList)
        }
        if (!isServerConnected.current) {
            if (Object.keys(props.availableIO).length > 0) {
                isServerConnected.current = true
                setSelectedDeviceList(Object.keys(props.availableIO))
                props.filterLogsCallback({"selectedDevices": Object.keys(props.availableIO)})
            }
        }
    }, [props.availableIO])

    const onEnter = (event) => {
        console.log(event.target.value)
        if (event.key === 'Enter') {
          props.filterLogsCallback({"search": event.target.value, "isRegex": enRegex})
        } else if (event.target.value === "") {
          props.filterLogsCallback({"search": "", "isRegex": enRegex})
        }
      };

    const handleInputChange = (e) => {
        const { value } = e.target;
        const isValueInList = selectedDeviceList.includes(value);
        console.log(isValueInList)
        setSelectedDeviceList(prevSelectedDeviceList => {
          if (isValueInList) {
            return prevSelectedDeviceList.filter(device => device !== value);
          } else {
            return [...prevSelectedDeviceList, value];
          }
        });
    };

    return (
        <React.Fragment>
            <div className='loggerContainer'>
                <div className='tempShit'>
                    <div className="logSettingsBar">
                        <Down className={`logConfigButton ${autoScroll ? "logButtonSelected" : null}`} onClick = {() => {setAutoScroll(!autoScroll)}} style={{"height": "100%", "float": "left"}}/>
                        <Time className={`logConfigButton ${toggleTime ? "logButtonSelected" : null}`} onClick = {() => {setToggleTime(!toggleTime)}} style={{"height": "100%", "float": "right"}}/>
                    </div>
                    <div className="logs">
                        {logs.map((log) => {
                            return (
                                log
                            )
                        })}
                    </div>
                </div>
                <div className="LogFilters">
                    <div className="titleDiv deviceTitle">
                        <h3>Filters</h3> 
                    </div>
                    {showDeviceWindow 
                    ?
                    
                    <div className='logFilterContent'>


                        <div className="deviceGrid">
                            {deviceList.map((deviceName, index) => {
                                return (
                                    <div className={`deviceButton ${selectedDeviceList.includes(deviceName) ? '' : 'inactive'}`} onClick={() => {handleDeviceClick(deviceName)}} key = {index++}>
                                        <p>{deviceName}</p>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="flex" onClick={() => {setShowDeviceWindow(!showDeviceWindow)}} style={{"width": "100%", "backgroundColor": '#161616', "borderRadius": "10px", "height": "40px"}}>
                            <p> Filter Logs</p>
                        </div>
                    </div>
                    
                    :
                    <div className='logFilterContent'>
                        <div className="inlineInput">
                            <p>Search</p>
                            <input type='text' onKeyUp ={onEnter}/>
                            <div className={`regexButton ${enRegex ? "logButtonSelected" : null}`} onClick={() => {setEnRegex(!enRegex)}}>
                                <Inspect/>
                            </div>
                        </div>
                        
                        <CalenderComponent filterLogsCallback = {props.filterLogsCallback}/>

                        <div className="warningSelectors ">
                            <div className='selector_1' onClick = {() => {handleButtonClick("warning")}}><p className={`warningButton ${clickedButtons.includes('warning') ? '' : 'inactive'}`}>warning</p></div>
                            <div className='selector_2' onClick = {() => {handleButtonClick("error")}}>  <p className={`errorButton   ${clickedButtons.includes('error')   ? '' : 'inactive'}`}>error</p></div>
                            <div className='selector_3' onClick = {() => {handleButtonClick("success")}}><p className={`successButton ${clickedButtons.includes('success') ? '' : 'inactive'}`}>success</p></div>
                            <div className='selector_4' onClick = {() => {handleButtonClick("info")}}><p className={`infoButton ${clickedButtons.includes('info') ? '' : 'inactive'}`}>info</p></div>
                        </div>
                        <div className="flex" onClick={() => {setShowDeviceWindow(!showDeviceWindow)}} style={{"width": "100%", "backgroundColor": '#161616', "borderRadius": "10px", "height": "40px"}}>
                            <p> Filter Devices</p>
                        </div>
                    </div>
                }

                </div>
            </div>
        </React.Fragment>
    )
}