import React, { useState, useRef } from 'react';
import Add from "../../IconComponents/Add.jsx";

export default function InputText(props) {
  const [isClicked, setIsClicked] = useState(1);
  const textToSendRef = useRef(null);
  const intervalRef = useRef(null);

  function clickButton() {
    console.log("clicked");
    setIsClicked(!isClicked);
  }

  function submitIO() {
    const textToSendValue = textToSendRef.current.value;
    const intervalValue = intervalRef.current.value;
    if (intervalValue === "" || textToSendValue === "" || textToSendValue < 0) {
      textToSendRef.current.style.boxShadow = "0 0 5px red";
      intervalRef.current.style.boxShadow = "0 0 5px red";
    } else {
      textToSendRef.current.style.boxShadow = "none";
      intervalRef.current.style.boxShadow = "none";

      props.addOutput({
        name: "OutputText",
        info: {
          text: textToSendValue,
          sendInterval: intervalValue
        }
      })

      clickButton();
      console.log("Text to Send:", textToSendValue);
      console.log("Interval (seconds):", intervalValue);
    }
  }

  return isClicked ? (
    <div className='tempIcon' onClick={clickButton}>
      <Add width="2em" height="2em" />
      Send Text
    </div>
  ) : (
    <div className='configureIOWindow'>
      <h3> Config Input Text </h3>
      <div className="inputBox">
        <input
          placeholder='Text To Send'
          ref={textToSendRef} // Reference for the text input
        />
      </div>
      <div className="inputBox">
        <input
          type="number"
          placeholder="Interval (seconds)"
          ref={intervalRef} // Reference for the interval input
        />
      </div>
      <button className="addDeviceButton" onClick={submitIO}>
        Add IO
      </button>
    </div>
  );
}
