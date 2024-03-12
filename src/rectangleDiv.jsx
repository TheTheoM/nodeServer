import React, { useEffect, useState } from 'react';
import Down from "./IconComponents/Down"
import Up from "./IconComponents/Up"
const RectangleDiv = (props) => {
    const [isExpanded, setIsExpanded] = useState(props.isExpanded);

    function resizeDiv() {
        setIsExpanded(!isExpanded)
    }
    
    return  (
        <div className='rectangleDiv'>
            <div className="titleDiv">
                <h2>{props.menuName}</h2>

                <div className="rightItemsContainer">
                    {props.rightItemList}
                  
                    <div className='resizeArrowContainer' onClick={resizeDiv}>
                        {isExpanded ? <Up/> : <Down/>}
                    </div>
                </div>

            </div>
            <div className={isExpanded ? "componentContainer" : " minimized"}>
                <div className={isExpanded ? "menuItem " : "menuItem minimized"}>
                    {props.MenuItem}
                </div>
            </div>
        </div>

    )
}

export default RectangleDiv;