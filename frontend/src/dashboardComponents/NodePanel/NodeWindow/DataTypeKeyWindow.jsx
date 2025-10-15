import React, { useEffect, useState } from "react";
import "./nodeFactoryStyles.css";

function DataKeyWindow({ isInfoClicked, showKeyWindow }) {
  return (
    <>
      {(!isInfoClicked && showKeyWindow) ? (
        <div className="DataKeyWindow">
          <p><span className="key-box typelessKey"></span>Typeless</p>
          <p><span className="key-box booleanKey"></span>Boolean</p>
          <p><span className="key-box arrayKey"></span>Integer</p>
          <p><span className="key-box intKey"></span>Array</p>
          <p><span className="key-box floatKey"></span>Float</p>
        </div>
      ) : null}
    </>
  );
}

export default DataKeyWindow;
