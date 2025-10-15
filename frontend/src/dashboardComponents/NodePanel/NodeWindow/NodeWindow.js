import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';

import './Node.css';
import Node from './Node';
import { debounce } from 'lodash';
import '@xyflow/react/dist/style.css';
import { MyContext } from '../../../ContextProvider/ContextProvider';
import DataKeyWindow from './DataTypeKeyWindow';
import LinkInfoWindow from './LinkInfoWindow';
import NodeInfoWindow from './NodeInfoButton';
import NodeCanvasSettings from './NodeCanvasSettings';

const proOptions = { hideAttribution: true };
const nodeTypes = { textUpdater: Node };

export default function NodeWindow({ height }) {
  const { context } = useContext(MyContext);
  const [nodes, setNodes, onNodesChange] = useNodesState();
  const [edges, setEdges, onEdgesChange] = useEdgesState([{}]);
  const [last, setLast] = useState();
  const [isInfoClicked, setIsInfoClicked] = useState(0);
  const [selectedEdgeInfo, setSelectedEdgeInfo] = useState(null);
  const [displayLinkData, setDisplayLinkData] = useState(0);
  const [snapToGrid, setSnapToGrid] = useState(() => {
    const saved = localStorage.getItem('snapToGrid');
    return saved === 'true' || false;
  });
  const [showKeyWindow, setShowKeyWindow] = useState(() => {
    const saved = localStorage.getItem('showKeyWindow');
    return saved === 'true' || false;
  });
  const [gridX, setGridX] = useState(() => Number(localStorage.getItem('gridX')) || 250);
  const [gridY, setGridY] = useState(() => Number(localStorage.getItem('gridY')) || 350);

  // Only update when values change to avoid overwriting with defaults.
  useEffect(() => {
    localStorage.setItem('snapToGrid', snapToGrid);
    localStorage.setItem('gridX', gridX);
    localStorage.setItem('gridY', gridY);
    localStorage.setItem('showKeyWindow', showKeyWindow);
  }, [snapToGrid, gridX, gridY, showKeyWindow]);

  const sendNodePositions = () => {
    const nodePositions = nodes.map((node) => ({
      position: node.position,
      name: node.key,
    }));
    context.nodes.sendNodePositions(nodePositions);
  };

  const debouncedSendNodePositions = debounce(sendNodePositions, 1000);

  useEffect(() => {
    debouncedSendNodePositions();
    return () => {
      debouncedSendNodePositions.cancel();
    };
  }, [nodes]);

  const onConnect = useCallback((params) => {
    context.linkFunctions.requestPersistentLink(
      params.source,
      params.sourceHandle,
      params.target,
      params.targetHandle
    );
    setEdges((els) => addEdge(params, els));
  }, []);

  useEffect(() => {
    if (JSON.stringify(context.availableIO) !== JSON.stringify(last)) {
      let initialNodes = [];
      let i = 0;

      Object.keys(context.availableIO).map((ioName) => {
        if (context.availableIO[ioName].isNode) {
          let x, y;
          if (context.availableIO[ioName] && context.availableIO[ioName].nodePosition) {
            x = context.availableIO[ioName].nodePosition.x;
            y = context.availableIO[ioName].nodePosition.y;
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
              inputs: context.availableIO[ioName].inputs,
              outputs: context.availableIO[ioName].outputs,
              widgets: context.availableIO[ioName].widgets,
              requestEditIO: context.nodes.requestEditIO,
              statusState: context.availableIO[ioName].statusState,
              isProcess: context.availableIO[ioName].isProcess,
              killProcess: context.processFunctions.killProcess,
              restartProcess: context.processFunctions.restartProcess,
            },
          });
        }
      });
      setNodes(initialNodes);
      setLast(context.availableIO);
    }
  }, [context.availableIO]);

  useEffect(() => {
    let localEdges = [];
    for (const key in context.activeLinks) {
      const value = context.activeLinks[key];
      localEdges.push({
        id: `${value.outputDevice}-${value.outputName}=>${value.inputDevice}-${value.inputName}`,
        key: `${value.outputDevice}-${value.outputName}=>${value.inputDevice}-${value.inputName}`,
        animated: true,
        source: value.outputDevice,
        sourceHandle: value.outputName,
        target: value.inputDevice,
        targetHandle: value.inputName,
        type: 'straight'
      });
    }
    setEdges(localEdges);
  }, [context.activeLinks]);

  function onEdges(params) {
    let selectedEdge = params.filter((edge) => edge.type === 'select' && edge.selected)[0];
    if (selectedEdge) {
      setDisplayLinkData(1);
      setSelectedEdgeInfo(selectedEdge.id);
    }
    onEdgesChange(params);
  }

  function deleteEdge(edges) {
    for (const index in edges) {
      let edge = edges[index];
      context.linkFunctions.breakPersistentLink(edge.source, edge.sourceHandle, edge.target, edge.targetHandle);
    }
    setDisplayLinkData(0);
  }

  const infoButtonClicked = function infoButtonClicked() {
    setIsInfoClicked(!isInfoClicked);
    setDisplayLinkData(0)
  };

  return (
    <div className='NodeCanvasWindow' style={{ height: height }}>
      {isInfoClicked ? (
        <NodeCanvasSettings
          snapToGrid={snapToGrid}
          setSnapToGrid={setSnapToGrid}
          gridX={gridX}
          setGridX={setGridX}
          gridY={gridY}
          setGridY={setGridY}
          showKeyWindow={showKeyWindow}
          setShowKeyWindow={setShowKeyWindow}
        />
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdges}
          onEdgesDelete={deleteEdge}
          onDelete={deleteEdge}
          nodeTypes={nodeTypes}
          fitView={true}
          proOptions={proOptions}
          onConnect={onConnect}
          key='reactFlow'
          deleteKeyCode={['Delete', 'Backspace']}
          snapToGrid={snapToGrid}
          snapGrid={[gridX, gridY]}
          onlyRenderVisibleElements={false}
        >
          <Background />
        </ReactFlow>
      )}

      {displayLinkData ? <LinkInfoWindow selectedEdgeInfo={selectedEdgeInfo} setDisplayLinkData = {setDisplayLinkData}/> : null}
      <DataKeyWindow isInfoClicked={isInfoClicked} showKeyWindow={showKeyWindow} />
      <NodeInfoWindow onClick={infoButtonClicked} />
    </div>
  );
}
