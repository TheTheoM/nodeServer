import React, { useState, useRef } from 'react';
import Add from "../../IconComponents/Add.jsx";
import Random from "../../IconComponents/Random.jsx";

export default function RGBCreator(props) {
  const [isClicked, setIsClicked] = useState(1);
  const [isRandom, setRandom] = useState(0);
  const [selectedColor, setSelectedColor] = useState([-1, -1, -1]);

  const noPixels = useRef(null);
  const maxValueRef = useRef(null);
  const intervalRef = useRef(null);

  function clickButton() {
    setIsClicked(!isClicked);
  }

  function setRandomState() {
    setRandom(!isRandom);
    setColor([-1, -1, -1]);
  }

  function generateRGBArray() {
    // Check if any of the input fields is empty
    let emptyBoxes = false;
  
    if (!noPixels.current.value) {
      applyBoxShadow(noPixels.current);
      emptyBoxes = true;
    } else {
      removeBoxShadow(noPixels.current);
    }
  
    if (!maxValueRef.current.value) {
      applyBoxShadow(maxValueRef.current);
      emptyBoxes = true;

    } else {
      removeBoxShadow(maxValueRef.current);
    }
  
    if (!intervalRef.current.value) {
      applyBoxShadow(intervalRef.current);
      emptyBoxes = true;

    } else {
      removeBoxShadow(intervalRef.current);
    }
  
    if (!emptyBoxes) {
        const rgbFormat = document.querySelector('.toggle-state').checked ? "rgb_2D" : "rgb_1D";

        props.addOutput({
            name: "RGBCreator",
            info: {
              maxPixelBrightness: maxValueRef.current.value,
              sendInterval: intervalRef.current.value,
              color: selectedColor,
              noPixels: noPixels.current.value,
              rgbFormat: rgbFormat,
            }
          })
        clickButton();
    }
  }
  
  // Function to apply box shadow to the input element
  function applyBoxShadow(element) {
    element.style.boxShadow = '0 0 5px red';
  }
  
  // Function to remove box shadow from the input element
  function removeBoxShadow(element) {
    element.style.boxShadow = 'none';
  }
  
  function setColor(color) {
    setSelectedColor(color);
  }

  return isClicked ? (
    <div className='tempIcon' onClick={clickButton}>
      <Add width="2em" height="2em" />
      RGB Array 
    </div>
  ) : (
    <div className='configureIOWindow'>
        <h3>Generate RGB Array</h3>
        <div className="optionsGrid" >
            <div className="displayFlex" style={{ 'justifyContent': 'space-around' }}>
                <div className="RGBCreatorHorizontalContainer">
                    r,g,b...
                    <label className="label">
                        <div className="toggle">
                            <input className="toggle-state" type="checkbox" name="check" value="check" />
                            <div className="indicator"></div>
                        </div>
                    </label>
                    [r,g,b]...
                </div>

                <div className="inputBox">
                    <input
                    type="number"
                    placeholder="No. Pixels (R,G,B)"
                    ref={noPixels}
                    />
                </div>
            </div>
        
            <div className="displayFlex">
                <div className={selectedColor.every(value => value === -1) ? "inputBox spaceAround randomOn" : "inputBox spaceAround"}>
                    <Random onClick={() => setColor([-1, -1, -1])} />
                    <input
                        type="number"
                        placeholder="Max Value"
                        ref={maxValueRef} // Reference for the max value input
                    />
                </div>
                <br></br>
                
                <div className="spaceAround" style={{ 'width': '150px' }}>
                    <div
                      className={`colorOption redButton ${selectedColor.every((value, index) => value === [255, 0, 0][index]) ? "ColourButtonClicked" : ""}`}
                      onClick={() => setColor([255, 0, 0])}
                    ></div>
                    <div
                      className={`colorOption greenButton ${selectedColor.every((value, index) => value === [0, 255, 0][index]) ? "ColourButtonClicked" : ""}`}
                      onClick={() => setColor([0, 255, 0])}
                    ></div>
                    <div
                      className={`colorOption blueButton ${selectedColor.every((value, index) => value === [0, 0, 255][index]) ? "ColourButtonClicked" : ""}`}
                      onClick={() => setColor([0, 0, 255])}
                    ></div>
                </div>

                <div
                  className={`colorOption whiteButton ${selectedColor.every((value, index) => value === [255, 255, 255][index]) ? "ColourButtonClicked" : ""}`}
                  onClick={() => setColor([255,255,255])}
                ></div>
            </div>
        
            <div className="displayFlex" style={{ 'justifyContent': 'space-around' }}>
                <div className="inputBox">
                    <input
                    type="number"
                    placeholder="Interval (seconds)"
                    ref={intervalRef} // Reference for the min value input
                    />
                </div>
                <button className="addDeviceButton" onClick={generateRGBArray}>
                    Generate
                </button>
            </div>
        </div>
    </div>
  );
}
