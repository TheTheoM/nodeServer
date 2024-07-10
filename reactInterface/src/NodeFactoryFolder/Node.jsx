import { useState, useHook, useEffect, useCallback } from "react";
import { Handle, Position } from 'reactflow';
import Widget from "./Widget";
import HandleWrapper from "./HandleWrapper"
import _debounce from 'lodash/debounce';
import "./nodeFactoryStyles.css"

function Node({ data, isConnectable }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [widgetList, setWidgetList] = useState([])
  const [editIOData, setEditIOData] = useState({})
  const [status, setStatus] = useState("");
  const [nodeHeight, setNodeHeight] = useState("200px");
  const validStatuses = ["offline", "alert", "fault", "criticalFault", "online"];
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

  let i = 0;
  let j = 0;

  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);


  const handleMouseMove = _debounce((e) => {
    setPosition({ x: e.clientX, y: e.clientY });
  }, 4); 

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  useEffect(() => {
    const outputBarElement = document.getElementById(`-outputBar_${data.name}`)
    const inputBarElement  = document.getElementById( `-inputBar_${data.name}`)
    
    let x  = (position.x - (outputBarElement.getBoundingClientRect().x + outputBarElement.getBoundingClientRect().width/2) )
    let y  = (position.y - (inputBarElement.getBoundingClientRect().y  + outputBarElement.getBoundingClientRect().height/2))

    let angle = Math.atan2(y,x) * (180 / Math.PI)
    // outputBarElement.style.rotate = (angle + "deg")
    // inputBarElement.style.rotate =  (angle + "deg")
    outputBarElement.style.transform = `rotate(${angle}deg)`;
    inputBarElement.style.transform = `rotate(${angle+180}deg)`; //Attempts GPU accel
}, [position])

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

    console.log(height)

    setNodeHeight(height)

  }, [data.inputs, data.outputs, widgetList])

  return (
    <div className="nodeContainer" style={{'height': nodeHeight}}>
      <div className="inputNodes">
        {(data.inputs).map(value => {
            return <HandleWrapper type="target" key = {value.toString()} id = {value.toString()}  style = {{"transform": "scale(1.5)", "border" : "1px solid #a3ffa3", "position" : 'relative'}} isConnectable={isConnectable} />
            }
          )}
      </div>

      <div className="outputNodes">
        {(data.outputs).map((value) => {
          return <HandleWrapper type="source" key = {value.toString()} id = {value.toString()} style = {{"transform": "scale(1.5)", "border" : "1px solid #E85454",  "position" : 'relative'}} isConnectable={isConnectable} />
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