import React, { useState, useRef, useEffect } from 'react';
const IconComponents = {
    Add: require('../IconComponents/Add').default,
    AddWithNoOutline: require('../IconComponents/AddWithNoOutline').default,
    BreakLink: require('../IconComponents/BreakLink').default,
    Cross: require('../IconComponents/Cross').default,
    DisconnectLink: require('../IconComponents/DisconnectLink').default,
    Down: require('../IconComponents/Down').default,
    Edit: require('../IconComponents/Edit').default,
    Encrypt: require('../IconComponents/Encrypt').default,
    Info: require('../IconComponents/Info').default,
    Inspect: require('../IconComponents/Inspect').default,
    Plug: require('../IconComponents/plug').default,
    Random: require('../IconComponents/Random').default,
    Socket: require('../IconComponents/socket').default,
    Time: require('../IconComponents/Time').default,
    Up: require('../IconComponents/Up').default,
    Chair: require('../IconComponents/Chair').default,
    Mute: require('../IconComponents/Mute').default,
  };
  

export default function Widget(props) {
    let widgetType = props.widgetType;
    let widgetName = props.widgetName;
    let values = props.values;
    let initialValue = props.value;
    const iconNames = ['Add', 'AddWithNoOutline', 'BreakLink', 'Cross', 'DisconnectLink', 'Down', 'Edit', 'Encrypt', 'Info', 'Inspect', 'plug', 'Random', 'socket', 'Time', 'Up', 'Chair', 'Mute'];
    const [sliderValue, setSliderValue] = useState(initialValue);
    const [menuVisible, setMenuVisible] = useState(0)
    const [instantMode, setInstantMode] = useState(1)
    const [inputText, setInputText]     = useState("")
    const [value, setValue] = useState(props.value)

    const handleInputChange = (e) => {
        const { value } = e.target;
        setSliderValue(value);
        props.editIO(widgetName, {[widgetName]: value})
    };

    const handleToggle = (event) => {
        props.setEditIOData(prevState => ({
            ...prevState,
            [widgetName]: event.target.checked ? values[1] : values[0]
        }));
        
        props.editIO(widgetName, {[widgetName]: event.target.checked ? values[1] : values[0]
        })
    };

    const handleIconPress = function handleIconPress() {
        // props.editIO(widgetName, {[widgetName]: props.value})
        props.editIO(widgetName, {[widgetName]: 'iconPressed'})
    } 
    
    useEffect(() => {
        setValue(props.value)
        setSliderValue(props.value)
    }, [props.value])
    
    const handleKeyUp = (event) => {
        console.log(event.target.value)
        if (event.key === 'Enter') {
            const inputValue = event.target.value;
            props.editIO(widgetName, {[widgetName]: inputValue})
        }
      }
    
    const handleHover = () => {
        setMenuVisible(true);
    };

    const handleLeave = () => {
        setMenuVisible(false);
    };

    useEffect(() => {
        setInputText(initialValue)
    }, [])

    if (widgetType === "dropDown") {
        return (
            <div className="widgetContainer">
                <div className='flex nodrag '>
                    <label className='label'>{widgetName}</label>
                    <select defaultChecked = {values[0]} onChange={handleInputChange}>
                        {values.map((value, index) => (
                            <option key={index} value={value}>
                                {value}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );
    
    } else if (widgetType === 'toggle') {
        return (
            <div className="widgetContainer" style={{"padding": "0px"}}>
                <div className="RGBCreatorHorizontalContainer nodrag">
                    {values[0]}
                    <label className="label">
                        <div className="toggle nodrag">
                            <input  className="toggle-state"  type="checkbox" name="check" onChange={handleToggle} checked={value === values[1] ? true : false}/>
                            <div className="indicator"></div>
                        </div>
                    </label>
                    {values[1]}
                </div>
            </div>
            );
    } else if (widgetType === 'slider') {
        return (
            <div className="widgetContainer">
                <div className='flex' style={{"justifyContent": "space-between"}}>
                    <p>{widgetName}: {sliderValue}</p>
                    <div className="checkbox-container nodrag" onMouseEnter={handleHover} onMouseLeave={handleLeave}>
                        <input type="checkbox" id="myCheckbox" checked={instantMode} onChange={() =>{setInstantMode(!instantMode)}}/>
                        {menuVisible 
                        ? 
                            <p className="instantMode">Instant Mode</p> 
                        :
                            null}
                    </div>
                </div>

                {instantMode
                ?
                    <input  className="nodrag" type="range" min={values[0]} max={values[1]} value={sliderValue}   onChange={(e) => {handleInputChange(e)}} />
                :
                    <input  className="nodrag" type="range" min={values[0]} max={values[1]} value={sliderValue}   onChange={(e) => setSliderValue(e.target.value)} onMouseUp ={handleInputChange} />
                }
            </div>
        );
        
    } else if (widgetType === 'number') {
        return (
            <div className="widgetContainer">
                <p>{widgetName}</p>
                <input className="nodrag" type="number" value = {inputText} onChange={(e) => setInputText(e.target.value)} onKeyUp={handleKeyUp} />
            </div>
        );
        
    } else if (widgetType === 'text')   {
        return (
            <div className="widgetContainer">
                <div className="button"></div>
                <input className="nodrag" type="text"  value = {inputText}       onChange={(e) => setInputText(e.target.value)} onKeyUp={handleKeyUp} />
            </div>
        );
        
    } else if (widgetType === 'displayIcon') {
        if (IconComponents.hasOwnProperty(props.value)) {
            const IconComponent = IconComponents[props.value];
            return (
                <div onClick={handleIconPress}>
                    <IconComponent height="2em" width="2em"  style = {props.style} />
                </div>
            ) 
            
          } else {
            return (
                <div>
                    Invalid Icon Name: {props.value}
                </div>
            );
          }
    } else {
        return (
            <div>
                Invalid widget type: {widgetType}
            </div>
        )
    }
}
