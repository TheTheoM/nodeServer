import React, { useCallback, useContext, useEffect, useState } from 'react';
import ReactFlow, { useNodesState, useEdgesState, addEdge, Background,updateEdge, MiniMap } from 'reactflow';
import RectangleDiv from '../rectangleDiv';
import 'reactflow/dist/style.css';
import Node from './Node';
import Widget from "./Widget.jsx";
import AddWithNoOutline from '../IconComponents/AddWithNoOutline';
import "./nodeFactoryStyles.css"
import LinkInfoWindow from "./LinkInfoWindow.jsx"
import TokenCyber from '../IconComponents/TokenCyber.jsx';
import { debounce } from 'lodash';

const proOptions = { hideAttribution: true };
const nodeTypes = { textUpdater: Node };

export default function NodeFactory(props) {
    const [nodes, setNodes, onNodesChange] = useNodesState();
    const [selectedEdgeInfo, setSelectedEdgeInfo] = useState(null)
    const [displayLinkData, setDisplayLinkData] = useState(0)
    const [edges, setEdges] = useEdgesState([{}]);
    const [isCyber,   setIsCyber] = useState(0)
    const [last, setLast] = useState()
    const minDistance = 50;

    const sendNodePositions = () => {
      const nodePositions = nodes.map((node) => ({ position: node.position, name: node.key }));
      props.sendNodePositions(nodePositions);
    };

    const debouncedSendNodePositions = debounce(sendNodePositions, 1000); 

    useEffect(() => {
      debouncedSendNodePositions();
      return () => {
        debouncedSendNodePositions.cancel();
      };
    }, [nodes]);



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
                      inputs: props.availableIO[ioName].inputs,
                      outputs: props.availableIO[ioName].outputs,
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

    function onEdgesChange(params) {
      let selectedEdge = params.filter(edge => (edge.type === 'select' && edge.selected))[0]
      if (selectedEdge) {
        setDisplayLinkData(1)
        setSelectedEdgeInfo(selectedEdge)
      }
      
    }
    
    function deleteEdge(edges) {
      for (const index in edges) {
        let edge = edges[index]
        props.breakPersistentLink(edge.source, edge.sourceHandle, edge.target, edge.targetHandle)
      }
      hideDisplayLinkData()
    }

    function hideDisplayLinkData() {
      setDisplayLinkData(0)
    }
    


    function toggleCyber() {
      setIsCyber(!isCyber)
    }


    return (
      <RectangleDiv
        menuName={"Node Factory"}
        rightItemList={[<div className='resizeArrowContainer' onClick={toggleCyber} ><TokenCyber width = {'1.2rem'}/></div>]
        }
        MenuItem={
          <div className="nodeFactory" style={{height: "550px"}}>
              <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes = {nodeTypes}
                  fitView = {true}
                  proOptions={proOptions}
                  onConnect={onConnect}
                  key = "reactFlow"
                  onEdgesDelete = {deleteEdge}
                  deleteKeyCode = {["Delete", "Backspace"]}
                  // elevateNodesOnSelect = {false}
                  >
                  <Background/>
              </ReactFlow>
                <LinkInfoWindow displayLinkData = {displayLinkData}  hideDisplayLinkData = {hideDisplayLinkData} selectedEdgeInfo = {selectedEdgeInfo} activeLinks = {props.activeLinks}
                  breakLink_By_LinkName  = {props.breakLink_By_LinkName} requestLinkDataInspect  = {props.requestLinkDataInspect}
                  Server_BreakPermanentLink  = {props.Server_BreakPermanentLink} isCyber = {isCyber}  key = "linkInfoWindow"

                />
          </div>
        }
        isExpanded = {props.isExpanded}
      />
    );
}

