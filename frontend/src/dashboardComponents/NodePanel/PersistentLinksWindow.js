import React, { useState, useEffect, useContext, useRef } from 'react';
import { MyContext } from '../../ContextProvider/ContextProvider';
import "./PersistentLinksWindow.css"
import PersistentLinks from './PersistentLink';
function PersistentLinksWindow() {
    const { context } = useContext(MyContext);
    const [searchTerm, setSearchTerm] = useState(''); 
    const [persistentLinksData, setPersistentLinksData] = useState([])
  
    function onExpanded(isExpanded, id) {
      const processListContainer = document.getElementById('PersistentLinks-list-container');
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


    useEffect(() => {
        const filteredPersistentLinks = Object.entries(context.persistentLinks).filter(([name]) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setPersistentLinksData(filteredPersistentLinks)
    }, [context.persistentLinks, searchTerm])

  
    return (
      <div className="PersistentLinksTab-container">
        
        <div className="PersistentLinks-subcontainer">
          <h3>PersistentLinks</h3>
          <input 
            type="text" 
            placeholder="Search PersistentLinks..." 
            className="PersistentLinks-searchbar"
            value={searchTerm} 
            onChange={handleSearchChange} 
          />
          <div className="PersistentLinks-list-container" id="PersistentLinks-list-container"  > 
            <div className="PersistentLinks-list" >

              {persistentLinksData.map(([linkName, persistentLinkData]) => {
                return <PersistentLinks initialOutputDevice = {persistentLinkData.outputDevice}
                                initialOutputName = {persistentLinkData.outputName} initialInputDevice = {persistentLinkData.inputDevice}
                                initialInputName = {persistentLinkData.inputName} name = {linkName} onExpanded = {onExpanded} isActive = {context.activeLinks[linkName] ? true : false} ID = {linkName} key = {linkName}/>
              })}
            </div>
          </div>
        </div>
      </div>
    );
}

export default PersistentLinksWindow;
