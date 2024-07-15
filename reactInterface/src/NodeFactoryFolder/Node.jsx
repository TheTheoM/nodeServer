import { useState, useHook, useEffect, useCallback } from "react";
import { Handle, Position } from 'reactflow';
import Widget from "./Widget";
import HandleWrapper from "./HandleWrapper"
import _debounce from 'lodash/debounce';
import "./nodeFactoryStyles.css"
import debounce from "lodash.debounce";
import {useUpdateNodeInternals } from 'reactflow';


function Node({ data, isConnectable }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [widgetList, setWidgetList] = useState([])
  const [editIOData, setEditIOData] = useState({})
  const [status, setStatus] = useState("");
  const [nodeHeight, setNodeHeight] = useState("200px");
  const validStatuses = ["offline", "alert", "fault", "criticalFault", "online"];
  const updateNodeInternals = useUpdateNodeInternals()

  useEffect(() => {
    updateNodeInternals(data.name)
  }, [data]);

  const handleHover = () => {
    setMenuVisible(true);
  };

  const handleLeave = () => {
    setMenuVisible(false);
  };

  function doesWidgetExist(output) {
    if (typeof data.widgets[output] === 'object' && data.widgets[output] !== null) {
      return true;
    }
    return false
  }

  useEffect(()=> {
    if (validStatuses.includes(data.statusState)) {
      setStatus(data.statusState);
    } 
  }, [data.statusState])

  useEffect(() => {
    if (Object.keys(data.widgets).length) {
      setWidgetList(data.widgets)
    }
  }, [data])

  const handleMouseMove = (e) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };
  
  useEffect(() => {
    let animationFrameId;
  
    const updatePosition = () => {
      animationFrameId = requestAnimationFrame(updatePosition);
  
      const outputBarElement = document.getElementById(`-outputBar_${data.name}`);
      const inputBarElement = document.getElementById(`-inputBar_${data.name}`);
  
      const outputRect = outputBarElement.getBoundingClientRect();
      const inputRect = inputBarElement.getBoundingClientRect();

      const x = position.x - (outputRect.x + outputRect.width / 2);
      const y = position.y - (inputRect.y + outputRect.height / 2);

      const angle = Math.atan2(y, x) * (180 / Math.PI);

      outputBarElement.style.transform = `rotate(${angle}deg)`;
      inputBarElement.style.transform = `rotate(${angle + 180}deg)`;
    };
  
    window.addEventListener('mousemove', handleMouseMove);
    updatePosition();
  
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [position]);
  
  function editIO(clickedOutput, editIOData) {
    data.requestEditIO(data.name, clickedOutput, editIOData)
    setEditIOData({})
  }


  useEffect(() => {
    const spacing = 15
    const widgetSpacing = 60

    let height_inputs = Math.max(data.inputs.length * spacing, 200) 

    let height_outputs = Math.max(data.outputs.length * spacing, 200) 

    let height_widgetList = Math.max(widgetList.length * widgetSpacing, 200) 

    let height = Math.max(height_inputs, height_outputs, height_widgetList) + "px"

    setNodeHeight(height)

  }, [data.inputs, data.outputs, widgetList])

  return (
    <div className="nodeContainer" style={{'height': nodeHeight}}>
      <div className="inputNodes">

        {Object.entries(data.inputs).map(([value, dataType]) => {
            return (
              <HandleWrapper 
                type="target" 
                key={value.toString()} 
                id={value.toString()} 
                style={{
                  position: 'relative',
                }} 
                isConnectable={isConnectable} 
                className = {dataType}
              />
            );
        })}
      </div>

      <div className="outputNodes">

        {Object.entries(data.outputs).map(([value, dataType]) => {
          return <HandleWrapper type="source" key = {value.toString()} id = {value.toString()} style = {{"transform": "scale(1.5)","position" : 'relative'}} isConnectable={true} className = {`OutputIO ${dataType}`}/>
          }
        )}
      </div>

      <div className="Node" style={{'height': nodeHeight}}>
        <div className={`alertBar ${status}`}></div>
        <div className="inputBar"  id = {`-inputBar_${data.name}`}></div>
        <div className="outputBar" id = {`-outputBar_${data.name}`}></div>
        <div className="NodeContent">
          <div className="NodeBanner">
            <p>{data.name}</p>
          </div>
          {widgetList.map((widget) => {
              return ( 
                <Widget
                  key={widget.widgetName}
                  widgetType={widget.widgetType}
                  widgetName={widget.widgetName}
                  values={widget.values}
                  value = {widget.value}
                  style = {widget.style}
                  editIOData={editIOData}
                  setEditIOData={setEditIOData}
                  className = "nodrag"
                  editIO = {editIO}
                />
              )
            })
          }
        </div>
      </div>
    </div>
  );
}

export default Node;