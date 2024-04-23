import { useCallback, useEffect, useState } from 'react';
import React from 'react';
import RectangleDiv from "../rectangleDiv";
import Logger from './Logger';
import "./logStyles.css"

export default function LoggingPanel(props) {
    return (
        <RectangleDiv
            menuName={"Logging Panel"}
            rightItemList={null}
            MenuItem={
                <div className='LoggerPanel flex'>
                    <Logger deviceLogs = {props.deviceLogs} availableIO = {props.availableIO} filterLogsCallback = {props.filterLogsCallback} />
                </div>
            }
            isExpanded = {true}
        />
    );
}
