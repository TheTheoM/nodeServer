import './Processes.css';
import React, { useState, useContext} from 'react';
import Process from './Process/Process';
import ProcessData from './ProcessData/ProcessData';
import AddProcess from './AddProcess/AddProcess';
import { MyContext } from '../../ContextProvider/ContextProvider';

function Processes() {  
  const { context } = useContext(MyContext);
  const [searchTerm, setSearchTerm] = useState(''); 

  function onExpanded(isExpanded, id) {
      const processListContainer = document.getElementById('process-list-bob');
      const clickedElement = document.getElementById(id);
      
      const targetScrollTop = clickedElement.offsetTop;
      
      animateScroll(processListContainer, targetScrollTop, 200); 
  
  }
  
  function animateScroll(container, targetPosition, duration) {
    const start = container.scrollTop; 
    const distance = targetPosition - start; 
    const startTime = performance.now(); 
  
    function scrollStep(currentTime) {
      const elapsed = currentTime - startTime;
      
      const progress = Math.min(elapsed / duration, 1);
      
      container.scrollTop = start + (distance * progress);
      
      if (elapsed < duration) {
        requestAnimationFrame(scrollStep);
      }
    }
  
    requestAnimationFrame(scrollStep); 
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredProcesses = Object.entries(context.processes).filter(([name]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="processesTab-container">
      
      <ProcessData/>

      <div className="processes-subcontainer">
        <h3>Processes</h3>
        <input 
          type="text" 
          placeholder="Search processes..." 
          className="process-searchbar"
          value={searchTerm} 
          onChange={handleSearchChange} 
        />
        <div className="process-list-container" id="process-list-bob">
          <div className="process-list" >
            {filteredProcesses.map(([name, process]) => (
              <Process 
                key={name}
                name={name}
                id={"Process-" + name} 
                status={process.status} 
                initialRuntime={process.runTime}
                initialRestartDelay={process.initialRestartDelay}
                initialPath={process.path}
                onExpanded={onExpanded}
                cpu={process.cpu}
                ram={process.memory}
                startup={process.startup}
              />
            ))}
          </div>
        </div>
      </div>

      <AddProcess/>
    </div>
  );
}

export default Processes;
