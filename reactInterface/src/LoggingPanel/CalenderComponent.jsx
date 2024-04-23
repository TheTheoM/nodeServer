import React, { useCallback, useEffect, useRef, useState } from 'react';
import Down from "../IconComponents/Down"
import Time from "../IconComponents/Time"
import Inspect from "../IconComponents/Inspect"
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css';
import "./logStyles.css"

export default function CalenderComponent(props) {
    const [fromWindowEnabled, setFromWindowEnabled] = useState(0)
    const [toWindowEnabled, setToWindowEnabled] = useState(0)
    const [fromDate, setFromDate] = useState(new Date("2000-01-01"));
    const [toDate,   setToDate]   = useState(new Date());
    
    useEffect(() => {
        setFilters()
        setToWindowEnabled(0)
    }, [toDate])
    
    useEffect(() => {
        setFilters()
        setFromWindowEnabled(0)
    }, [fromDate])

    function setFilters() {
        console.log(fromDate)
        
        console.log(toDate)

        props.filterLogsCallback({"time": {"from": fromDate,  "to": toDate}})
        
    }
    
    return (
        <div className='calenderDiv'>
            {fromWindowEnabled ? 
                <div className="calenderWindow">
                    <Calendar onChange={setFromDate} value={fromDate} />
                </div>
            : null}

            {toWindowEnabled ? 
                <div className="calenderWindow">
                    <Calendar  onChange={setToDate} value={toDate} />
                </div>
            : null}


            <div className="buttonContainer">
                <div className='dateContainer'>
                    <button onClick = {() => {setFromWindowEnabled(!fromWindowEnabled)}}> From </button>
                    <p>{fromDate.toDateString()}</p>
                </div>
                <div className='dateContainer'>
                    <button onClick = {() => {setToWindowEnabled(!toWindowEnabled)}}> To </button>
                    <p>{toDate.toDateString()}</p>
                </div>
            </div>

        </div>
    )
}