import { useState, useHook, useEffect, useCallback } from "react";
import { Handle, Position, useUpdateNodeInternals  } from '@xyflow/react';
import Widget from "./Widget";
import HandleWrapper from "./HandleWrapper"
import "./nodeFactoryStyles.css"
import Gear from '../../../IconComponents/Gear.jsx';

function Node({ data, isConnectable }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [widgetList, setWidgetList] = useState([])
  const [editIOData, setEditIOData] = useState({})
  const [status, setStatus] = useState("");
  const [showNodeSettings, setShowNodeSettings] = useState(0);
  const [nodeHeight, setNodeHeight] = useState("200px");
  const validStatuses = ["offline", "alert", "fault", "criticalFault", "online"];
  const updateNodeInternals = useUpdateNodeInternals();

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
  
  function editIO(clickedOutput, editIOData) {
    data.requestEditIO(data.name, clickedOutput, editIOData)
    setEditIOData({})
  }


  useEffect(() => {
    setTimeout(() => {
    updateNodeInternals(data.name)

    }, 50)
  }, []);

  useEffect(() => {
    updateNodeInternals(data.name)
  }, [data]);

  useEffect(() => {
    const spacing = 15
    const widgetSpacing = 80

    let height_inputs = Math.max(Object.keys(data.inputs).length * spacing, 200) 

    let height_outputs = Math.max(Object.keys(data.outputs).length * spacing, 200) 

    let height_widgetList = Math.max(widgetList.length * widgetSpacing, 200) 

    let height = Math.max(height_inputs, height_outputs, height_widgetList) + "px"

    setNodeHeight(height)

  }, [data.inputs, data.outputs, widgetList])

  function restartNode() {
    data.restartProcess(data.name)
  }
  function killNode() {
    data.killProcess(data.name)

  }

  return (
    <div className="nodeContainer" style={{'height': nodeHeight}}>
      <Gear height = {"1em"} className = {"nodeGear"} onClick = {() => {setShowNodeSettings(!showNodeSettings)}}/>
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

        {showNodeSettings ?
          <div className="NodeContent">
            {data.isProcess 
              ?
              <>
                <button onClick={restartNode}>Restart</button>
                <button onClick={killNode}>Kill</button>
              </>
              :
              <p>Not managed by server. No Options.</p>
            }
          </div>
        :
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
        }
      </div>
    </div>
  );
}

export default Node;