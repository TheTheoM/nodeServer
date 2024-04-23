
import React from 'react';

const InputLabel = ({Icon, text, onClick, iconStyleClass, style}) => {

    function inputClicked() {
        if (typeof(onClick) !== 'undefined') {
            onClick(text)
        }
    }

    return (
        <div className={`ioLabel inputs ${iconStyleClass}`} onClick={inputClicked} style = {style}> 
            <Icon style = {style}/>
            <p>{text}</p>
        </div>
    );
}

export default InputLabel;
