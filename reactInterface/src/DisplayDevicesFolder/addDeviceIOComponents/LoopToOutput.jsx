import React, { useState, useRef } from 'react';
import Add from "../../IconComponents/Add.jsx";

export default function ConnectToOutput(props) {
  const [isClicked, setIsClicked] = useState(1);
  const outputName = useRef(null);

  function clickButton() {
    console.log("clicked");
    setIsClicked(!isClicked);
  }

  function submitIO() {
    if ( outputName.current.value === "" || outputName.current.value < 0) {
      outputName.current.style.boxShadow = "0 0 5px red";
    } else {
      outputName.current.style.boxShadow = "none";

      props.addInput({
        name: `LinkTo-${outputName.current.value}`,
        info: {
          'outputName': `LinkTo-${outputName.current.value}`,
        }
      })

      clickButton();
    }
  }

  return isClicked ? (
    <div className='tempIcon' onClick={clickButton}>
      <Add width="2em" height="2em" />
      Loop to Output
    </div>
  ) : (
    <div className='configureIOWindow'>
      <h3> Config Input Text </h3>
      <div className="inputBox">
        <input
          placeholder='Output Name'
          ref={outputName} 
        />
      </div>
      <button className="addDeviceButton" onClick={submitIO}>
        Add IO
      </button>
    </div>
  );
}
