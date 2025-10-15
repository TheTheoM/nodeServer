import React from 'react';
import NodeWindow from "./NodeWindow/NodeWindow"
import PersistentLinksWindow from './PersistentLinksWindow';

function NodePanel() {
  return (
    <div className="node-container">
      <NodeWindow/>
      <PersistentLinksWindow/>
    </div>
  );
}

export default NodePanel;
