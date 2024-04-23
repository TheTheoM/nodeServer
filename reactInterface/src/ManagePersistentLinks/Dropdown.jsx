import React, { useEffect, useState } from 'react';

const Dropdown = (props) => {
  const [selectedOption, setSelectedOption] = useState('');

  const handleSelectChange = (e) => {
    setSelectedOption(e.target.value);
  };
  
  useEffect(() => {
    setSelectedOption(props.defaultValue)
  }, [props.defaultValue])

  return (
    <div className="dropdown-container">
      <select id="dropdown" value={selectedOption} onChange={handleSelectChange}>
        <option value="" disabled>Select an option</option>
        {props.options.map((option, index) => (
          <option key={index} value={option.toLowerCase().replace(/\s+/g, '-')}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;
