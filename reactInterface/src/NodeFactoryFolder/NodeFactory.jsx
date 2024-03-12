import React, { useCallback, useContext, useEffect, useState } from 'react';
import ReactFlow, { useNodesState, useEdgesState, addEdge, Background,updateEdge, MiniMap } from 'reactflow';
import RectangleDiv from '../rectangleDiv';
import 'reactflow/dist/style.css';
import Node from './Node';
import Widget from "../DisplayDevicesFolder/Widget.jsx";
import AddWithNoOutline from '../IconComponents/AddWithNoOutline';
import "./nodeFactoryStyles.css"
import LinkInfoWindow from "./LinkInfoWindow.jsx"

const proOptions = { hideAttribution: true };
const nodeTypes = { textUpdater: Node };

export default function NodeFactory(props) {
    const [nodes, setNodes, onNodesChange] = useNodesState();
    const [edges, setEdges] = useEdgesState([{}]);
    const [last, setLast]                  = useState()

    const minDistance = 50;

    const [selectedEdgeInfo, setSelectedEdgeInfo] = useState(null)
    const [displayLinkData, setDisplayLinkData] = useState(0)

    useEffect(() => {
      if (JSON.stringify(props.availableIO) !== JSON.stringify(last)) {
          let initialNodes = []
          let i = 0;

        Object.keys(props.availableIO).map((ioName) => {
            if (props.availableIO[ioName].isNode) {
              let x,y
              if (props.availableIO[ioName] && props.availableIO[ioName].nodePosition) {
                x = props.availableIO[ioName].nodePosition.x;
                y = props.availableIO[ioName].nodePosition.y;
              } else {
                x = i * 200;
                y = 0;
              }
          
              i++;

              initialNodes.push({
                  key: ioName.toString(),
                  id: ioName.toString(),
                  type: 'textUpdater',
                  position: { x, y },
                  data: {
                      name: ioName.toString(),
                      inputs: props.availableIO[ioName].all_inputs,
                      outputs: props.availableIO[ioName].all_outputs,
                      widgets: props.availableIO[ioName].widgets,
                      requestEditIO: props.requestEditIO,
                      statusState: props.availableIO[ioName].statusState,
                  },
              });
          }
        }
        )
        setNodes(initialNodes)
        setLast(props.availableIO)
      }
    }, [props.availableIO]);

    
    useEffect(() => {
      let localEdges = [];
      for (const key in props.activeLinks) {
        const value = props.activeLinks[key];
        localEdges.push({
          id :     `${value.outputDevice}.${value.outputName}.${value.inputDevice}.${value.inputName}`,
          animated:       true,
          source :        value.outputDevice,
          sourceHandle :  value.outputName,
          target :        value.inputDevice,
          targetHandle :  value.inputName,
        })
      }
      setEdges(localEdges)
    }, [props.activeLinks])

    const onConnect = useCallback((params) => 
        {
          props.requestPersistentLink(params.source, params.sourceHandle, params.target, params.targetHandle)
          setEdges((els) => addEdge(params, els))
        },
    []);

    function onEdges(params) {
      // REDO this function is gross
 

      let selectedEdge = params.filter(edge => (edge.type === 'select' && edge.selected))[0]

      if (selectedEdge) {
        setDisplayLinkData(1)
        setSelectedEdgeInfo(selectedEdge)
        return  
      }
      
      setDisplayLinkData(0)
      setSelectedEdgeInfo(null)
      
      let removeEdge = params.filter(edge => edge.type === 'remove')[0]
      if (removeEdge) {
        let [outputDevice, outputName, inputDevice, inputName] = removeEdge.id.split('.');
        props.breakPersistentLink(outputDevice, outputName, inputDevice, inputName)
      }
    }

    
    function hideDisplayLinkData() {
      setDisplayLinkData(0)

    }
    
    function saveNodePositions() {
      props.sendNodePositions(nodes.map((node) => {return {position: node.position, name: node.key}}))
    }


    return (
      <RectangleDiv
        menuName={"Node Factory"}
        rightItemList={<div className='resizeArrowContainer' onClick={saveNodePositions} ><AddWithNoOutline/></div>}
        MenuItem={
          <div className="nodeFactory" style={{height: "550px"}}>
              <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdges}
                  nodeTypes = {nodeTypes}
                  fitView = {true}
                  proOptions={proOptions}
                  onConnect={onConnect}
                  >
                  <Background/>
              </ReactFlow>


                <LinkInfoWindow displayLinkData = {displayLinkData}  hideDisplayLinkData = {hideDisplayLinkData} selectedEdgeInfo = {selectedEdgeInfo} activeLinks = {props.activeLinks}
                  breakLink_By_LinkName  = {props.breakLink_By_LinkName} requestLinkDataInspect  = {props.requestLinkDataInspect}
                  Server_BreakPermanentLink  = {props.Server_BreakPermanentLink}
                />
          </div>
        }
        isExpanded = {props.isExpanded}
      />
    );
}

