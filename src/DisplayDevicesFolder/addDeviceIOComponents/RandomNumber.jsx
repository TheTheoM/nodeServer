import React, { useState, useRef } from 'react';
import Add from "../../IconComponents/Add.jsx";

export default function RandomNumber(props) {
  const [isClicked, setIsClicked] = useState(1);
  const minValueRef = useRef(null);
  const maxValueRef = useRef(null);
  const intervalValueRef = useRef(null);
  const decimalCheckboxRef = useRef(null);

  function clickButton() {
    console.log("clicked");
    setIsClicked(!isClicked);
  }

  function generateRandomNumber() {
    const minValue = Number(minValueRef.current.value);
    const maxValue = Number(maxValueRef.current.value);
    // const allowDecimals = decimalCheckboxRef.current.checked;
    const intervalValue = Number(intervalValueRef.current.value);
    
    if (isNaN(minValue) || isNaN(maxValue)) {
      minValueRef.current.style.boxShadow = "0 0 5px red";
      maxValueRef.current.style.boxShadow = "0 0 5px red";
    } else {
      minValueRef.current.style.boxShadow = "none";
      maxValueRef.current.style.boxShadow = "none";

      props.addOutput({
        name: "RandomNumber",
        info: {
          'sendInterval': intervalValue,
          'maxValue': maxValue,
          'minValue': minValue,
        }
      })

      clickButton();
    }
  }

  return isClicked ? (
    <div className='tempIcon' onClick={clickButton}>
      <Add width="2em" height="2em" />
      Rand Num
    </div>
  ) : (
    <div className='configureIOWindow'>
      <h3>Generate Random Number</h3>
      <div className="inputHorizontalContainer">
        <div className="inputBox" style = {{"width" : "45%", "height": "30px", "float": "left"}}>
            <input
            type="number"
            placeholder='Min Value'
            ref={minValueRef}
            />
        </div>
        <div className="inputBox" style = {{"width" : "45%", "height": "30px", "float": "right"}}>
            <input
            type="number"
            placeholder="Max Value"
            ref={maxValueRef}
            />
        </div>
      </div>
      <div className="inputBox" style = {{"height": "30px"}}>
            <input
            type="number"
            placeholder="Interval (ms)"
            ref={intervalValueRef}
            />
        </div>

      <button className="addDeviceButton" onClick={generateRandomNumber}>
        Generate
      </button>
    </div>
  );
}

{/* <label>
<input
  type="checkbox"
  ref={decimalCheckboxRef}
/>
Allow Float
</label> */}